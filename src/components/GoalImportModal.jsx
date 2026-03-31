import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';

const EXAMPLE_JSON = `[
  {
    "title": "Read 12 books this year",
    "type": "long_term",
    "description": "Build a consistent reading habit by finishing one book per month.",
    "targetDate": "2025-12-31",
    "workingDays": ["monday", "wednesday", "friday"],
    "tasks": [
      { "title": "Pick next book", "completed": false },
      { "title": "Read 20 pages daily", "completed": false }
    ]
  },
  {
    "title": "Finish React course",
    "type": "short_term",
    "description": "Complete the advanced React patterns module.",
    "targetDate": "2025-04-30",
    "workingDays": ["tuesday", "thursday"],
    "tasks": []
  }
]`;

function validate(parsed) {
    if (!Array.isArray(parsed)) return 'Root must be a JSON array of goals.';
    if (parsed.length === 0) return 'Array must contain at least one goal.';
    if (parsed.length > 50) return 'Maximum 50 goals per import.';

    const validTypes = ['long_term', 'short_term'];
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const errors = [];

    parsed.forEach((g, i) => {
        if (!g.title || typeof g.title !== 'string' || !g.title.trim()) {
            errors.push(`Goal #${i + 1}: "title" is required.`);
        }
        if (!validTypes.includes(g.type)) {
            errors.push(`Goal #${i + 1}: "type" must be "long_term" or "short_term".`);
        }
        if (g.workingDays && !Array.isArray(g.workingDays)) {
            errors.push(`Goal #${i + 1}: "workingDays" must be an array.`);
        } else if (g.workingDays) {
            g.workingDays.forEach(d => {
                if (!validDays.includes(d))
                    errors.push(`Goal #${i + 1}: unknown day "${d}" in workingDays.`);
            });
        }
        if (g.tasks && !Array.isArray(g.tasks)) {
            errors.push(`Goal #${i + 1}: "tasks" must be an array.`);
        }
    });

    return errors.length ? errors : null;
}

export default function GoalImportModal({ onImport, onClose }) {
    const [text, setText] = useState('');
    const [parsed, setParsed] = useState(null);
    const [parseError, setParseError] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showExample, setShowExample] = useState(false);

    const handleParse = (raw) => {
        setText(raw);
        setParseError('');
        setValidationErrors([]);
        setParsed(null);

        if (!raw.trim()) return;

        try {
            const obj = JSON.parse(raw);
            const errs = validate(obj);
            if (errs) {
                setValidationErrors(errs);
            } else {
                setParsed(obj);
            }
        } catch (e) {
            setParseError(`JSON syntax error: ${e.message}`);
        }
    };

    const handleImport = async () => {
        if (!parsed) return;
        setLoading(true);
        try {
            await onImport(parsed);
        } catch {
            setLoading(false);
        }
    };

    const loadExample = () => {
        handleParse(EXAMPLE_JSON);
        setShowExample(false);
    };

    const isValid = parsed && validationErrors.length === 0 && !parseError;

    return (
        <div
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            <div className="modal-content" style={{ maxWidth: 680, width: '95vw' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileJson size={20} style={{ color: 'var(--mauve)' }} />
                        Import Goals from JSON
                    </h2>
                    <button id="modal-import-close" className="btn btn-icon" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Instructions */}
                    <div style={{
                        background: 'rgba(137, 180, 250, 0.08)',
                        border: '1px solid rgba(137, 180, 250, 0.2)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        fontSize: '0.875rem',
                        color: 'var(--subtext1)',
                        lineHeight: 1.6,
                    }}>
                        Paste a <strong style={{ color: 'var(--blue)' }}>JSON array</strong> of goals below.
                        Each goal must have <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>title</code> and{' '}
                        <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>type</code>{' '}
                        (<code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>"long_term"</code> or{' '}
                        <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>"short_term"</code>).
                        Optional fields: <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>description</code>,{' '}
                        <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>targetDate</code>,{' '}
                        <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>workingDays</code>,{' '}
                        <code style={{ background: 'var(--surface0)', padding: '1px 5px', borderRadius: 4 }}>tasks</code>.
                    </div>

                    {/* Textarea */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={{ marginBottom: 0 }}>JSON Data</label>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                                onClick={loadExample}
                            >
                                Load Example
                            </button>
                        </div>
                        <textarea
                            id="goal-import-json"
                            value={text}
                            onChange={e => handleParse(e.target.value)}
                            placeholder={`[\n  {\n    "title": "My Goal",\n    "type": "short_term"\n  }\n]`}
                            rows={12}
                            style={{
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                                fontSize: '0.82rem',
                                lineHeight: 1.7,
                                resize: 'vertical',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                                borderColor: parseError || validationErrors.length
                                    ? 'var(--red)'
                                    : isValid
                                        ? 'var(--green)'
                                        : undefined,
                            }}
                        />
                    </div>

                    {/* Parse error */}
                    {parseError && (
                        <div style={{
                            display: 'flex', gap: 8, alignItems: 'flex-start',
                            background: 'rgba(243, 139, 168, 0.1)',
                            border: '1px solid rgba(243, 139, 168, 0.3)',
                            borderRadius: 8, padding: '10px 14px',
                            color: 'var(--red)', fontSize: '0.85rem',
                        }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{parseError}</span>
                        </div>
                    )}

                    {/* Validation errors */}
                    {validationErrors.length > 0 && (
                        <div style={{
                            background: 'rgba(243, 139, 168, 0.08)',
                            border: '1px solid rgba(243, 139, 168, 0.25)',
                            borderRadius: 8, padding: '10px 14px',
                            color: 'var(--red)', fontSize: '0.85rem',
                        }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontWeight: 700 }}>
                                <AlertCircle size={16} />
                                Validation errors:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Preview */}
                    {isValid && (
                        <div style={{
                            background: 'rgba(166, 227, 161, 0.07)',
                            border: '1px solid rgba(166, 227, 161, 0.25)',
                            borderRadius: 10, padding: '12px 16px',
                        }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem' }}>
                                <CheckCircle2 size={16} />
                                {parsed.length} goal{parsed.length !== 1 ? 's' : ''} ready to import
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                                {parsed.map((g, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'var(--surface0)', borderRadius: 8,
                                        padding: '8px 12px', fontSize: '0.875rem',
                                    }}>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                                            letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 20,
                                            background: g.type === 'long_term'
                                                ? 'rgba(137, 180, 250, 0.15)'
                                                : 'rgba(203, 166, 247, 0.15)',
                                            color: g.type === 'long_term' ? 'var(--blue)' : 'var(--mauve)',
                                            flexShrink: 0,
                                        }}>
                                            {g.type === 'long_term' ? 'Long' : 'Short'}
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {g.title}
                                        </span>
                                        {g.tasks?.length > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--subtext0)', flexShrink: 0 }}>
                                                {g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        id="btn-import-goals-submit"
                        type="button"
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!isValid || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Upload size={15} />
                        {loading ? 'Importing…' : `Import ${isValid ? parsed.length : ''} Goal${parsed?.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
