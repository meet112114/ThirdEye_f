import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export default function GoalModal({ goal, onSave, onClose }) {
    const isEdit = !!goal;
    const [form, setForm] = useState({
        title: goal?.title || '',
        type: goal?.type || 'short_term',
        description: goal?.description || '',
        metadata: goal?.metadata || '',
        targetDate: goal?.targetDate ? goal.targetDate.slice(0, 10) : '',
        workingDays: goal?.workingDays || [],
        status: goal?.status || 'active',
        tasks: goal?.tasks || [],
        linkedProgram: goal?.linkedProgram || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [momentumPrograms, setMomentumPrograms] = useState([]);

    useEffect(() => {
        api.get('/momentum')
            .then(res => setMomentumPrograms(res.data.programs || []))
            .catch(() => {});
    }, []);

    const set = (key, val) => { setForm(p => ({ ...p, [key]: val })); setError(''); };

    const toggleDay = (day) => {
        set('workingDays', form.workingDays.includes(day)
            ? form.workingDays.filter(d => d !== day)
            : [...form.workingDays, day]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required.'); return; }
        setLoading(true);
        try {
            await onSave({
                title: form.title.trim(),
                type: form.type,
                description: form.description.trim(),
                metadata: form.metadata.trim(),
                targetDate: form.targetDate || null,
                workingDays: form.workingDays,
                status: form.status,
                tasks: form.tasks.filter(t => t.title.trim() !== ''),
                linkedProgram: form.linkedProgram,
            });
        } catch {
            setError('Failed to save. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Goal' : 'New Goal'}</h2>
                    <button id="modal-goal-close" className="btn btn-icon" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Type toggle */}
                        <div className="form-group">
                            <label>Goal Type</label>
                            <div className="toggle-group">
                                <button type="button"
                                    className={`toggle-btn ${form.type === 'short_term' ? 'active' : ''}`}
                                    onClick={() => set('type', 'short_term')}>
                                    Short-term
                                </button>
                                <button type="button"
                                    className={`toggle-btn ${form.type === 'long_term' ? 'active' : ''}`}
                                    onClick={() => set('type', 'long_term')}>
                                    Long-term
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="goal-title">Title *</label>
                            <input id="goal-title" type="text" placeholder="e.g. Run 5km every day" value={form.title}
                                onChange={e => set('title', e.target.value)} autoFocus maxLength={200} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="goal-desc">Description</label>
                            <textarea id="goal-desc" placeholder="Describe the goal in more detail…" value={form.description}
                                onChange={e => set('description', e.target.value)} rows={3} maxLength={2000} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="goal-meta">Notes for AI Analysis</label>
                            <textarea id="goal-meta" placeholder="Context, motivation, observations, anything useful for AI to understand this goal…"
                                value={form.metadata} onChange={e => set('metadata', e.target.value)} rows={3} maxLength={5000} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="goal-date">Target Date (optional)</label>
                            <input id="goal-date" type="date" value={form.targetDate}
                                onChange={e => set('targetDate', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Working Days</label>
                            <div className="working-days-row">
                                {ALL_DAYS.map(day => (
                                    <button key={day} type="button"
                                        className={`day-toggle-btn ${form.workingDays.includes(day) ? 'active' : ''}`}
                                        onClick={() => toggleDay(day)}>
                                        {DAY_LABELS[day]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isEdit && (
                            <div className="form-group">
                                <label htmlFor="goal-status">Status</label>
                                <select id="goal-status" value={form.status} onChange={e => set('status', e.target.value)}>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="goal-linked">Link to Habit (optional)</label>
                            <select id="goal-linked" value={form.linkedProgram} onChange={e => set('linkedProgram', e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--surface0)', color: 'var(--text)', border: '1px solid var(--surface1)', borderRadius: '8px' }}>
                                <option value="">None</option>
                                {momentumPrograms.map(p => (
                                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Manage Tasks (Sub-goals)</label>
                            <div className="tasks-editor-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {form.tasks.map((task, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            value={task.title}
                                            onChange={e => {
                                                const newTasks = [...form.tasks];
                                                newTasks[idx].title = e.target.value;
                                                set('tasks', newTasks);
                                            }}
                                            placeholder="Task outline..."
                                            style={{ flex: 1, marginBottom: 0 }}
                                        />
                                        <button type="button" className="btn-icon danger" onClick={() => {
                                            set('tasks', form.tasks.filter((_, i) => i !== idx));
                                        }} style={{ color: 'var(--red)', background: 'rgba(243, 139, 168, 0.15)', borderRadius: '8px', padding: '10px' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-ghost" onClick={() => set('tasks', [...form.tasks, { title: '', completed: false }])} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                                    + Add Sub-task
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" id="btn-save-goal" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving…' : isEdit ? 'Update Goal' : 'Add Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
