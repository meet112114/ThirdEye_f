import { useState } from 'react';
import { formatTime, getTagColor } from '../utils/dateUtils';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const META_PREVIEW_LEN = 140;

export default function EventCard({ event, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const hasMeta = event.metadata && event.metadata.trim().length > 0;
    const isLong = hasMeta && event.metadata.length > META_PREVIEW_LEN;

    const handleDelete = async () => {
        if (!window.confirm('Delete this event permanently?')) return;
        setDeleting(true);
        try {
            await onDelete(event._id);
        } catch {
            setDeleting(false);
        }
    };

    return (
        <div className="event-card" role="article">
            <div className="event-card-top">
                <div className="event-card-left">
                    <span className="event-time-badge">{formatTime(event.timestamp)}</span>
                    <h3 className="event-title">{event.title}</h3>
                </div>
                <div className="event-card-actions">
                    <button
                        id={`btn-edit-${event._id}`}
                        className="btn btn-icon"
                        onClick={() => onEdit(event)}
                        aria-label="Edit event"
                        title="Edit"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        id={`btn-delete-${event._id}`}
                        className="btn btn-icon"
                        onClick={handleDelete}
                        disabled={deleting}
                        aria-label="Delete event"
                        title="Delete"
                        style={{ color: 'var(--red)' }}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {event.tags && event.tags.length > 0 && (
                <div className="event-tags">
                    {event.tags.map((tag) => (
                        <span key={tag} className={`tag-chip ${getTagColor(tag)}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {hasMeta && (
                <div className="event-meta-preview">
                    {expanded || !isLong
                        ? event.metadata
                        : `${event.metadata.slice(0, META_PREVIEW_LEN)}…`}
                    {isLong && (
                        <button
                            className="event-meta-toggle"
                            onClick={() => setExpanded((p) => !p)}
                            aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
                        >
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
