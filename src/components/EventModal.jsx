import { useState } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import TagInput from './TagInput';
import { nowTimeLocal, buildTimestamp, formatTime } from '../utils/dateUtils';

export default function EventModal({ selectedDate, event, onSave, onClose, onDelete }) {
    const isEdit = !!event;

    const getInitialTime = () => {
        if (event?.timestamp) return formatTime(event.timestamp);
        return nowTimeLocal();
    };

    const [form, setForm] = useState({
        title: event?.title || '',
        time: getInitialTime(),
        tags: event?.tags || [],
        metadata: event?.metadata || '',
    });
    const [useNow, setUseNow] = useState(!isEdit);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNow = () => {
        setForm((p) => ({ ...p, time: nowTimeLocal() }));
        setUseNow(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (name === 'time') setUseNow(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Please add a title.');
            return;
        }
        if (!form.time || !/^\d{2}:\d{2}$/.test(form.time)) {
            setError('Please enter a valid time (HH:MM).');
            return;
        }
        setLoading(true);
        try {
            const timestamp = buildTimestamp(selectedDate, form.time);
            await onSave({
                title: form.title.trim(),
                timestamp,
                tags: form.tags,
                metadata: form.metadata.trim(),
            });
        } catch {
            setError('Failed to save event. Please try again.');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this event?')) return;
        setLoading(true);
        try {
            await onDelete(event._id);
        } catch {
            setError('Failed to delete.');
            setLoading(false);
        }
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Event' : 'New Event'}</h2>
                    <button id="modal-close" className="btn btn-icon" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="evt-title">Title *</label>
                            <input
                                id="evt-title"
                                name="title"
                                type="text"
                                placeholder="Morning run, Client call…"
                                value={form.title}
                                onChange={handleChange}
                                autoFocus
                                maxLength={200}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Time *</label>
                        </div>
                        <div className="time-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    id="evt-time"
                                    name="time"
                                    type="time"
                                    value={form.time}
                                    onChange={handleChange}
                                />
                            </div>
                            <button
                                type="button"
                                id="btn-now"
                                className="btn btn-now"
                                onClick={handleNow}
                                style={{ flexShrink: 0 }}
                            >
                                <Zap size={14} />
                                Now
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Tags</label>
                            <TagInput tags={form.tags} onChange={(tags) => setForm((p) => ({ ...p, tags }))} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="evt-metadata">Notes / Context</label>
                            <textarea
                                id="evt-metadata"
                                name="metadata"
                                placeholder="How you felt, what happened, anything worth noting for future analysis…"
                                value={form.metadata}
                                onChange={handleChange}
                                rows={4}
                                maxLength={5000}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        {isEdit && (
                            <button
                                type="button"
                                id="btn-delete-event"
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="btn-save-event"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving…' : isEdit ? 'Update Event' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
