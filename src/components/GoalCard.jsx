import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, CheckCircle, PauseCircle, PlayCircle, Circle, Flame } from 'lucide-react';
import { computeProgramStats } from '../pages/momentum/utils/scoring';
import api from '../api/axios';

const DAY_ABBR = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const META_LEN = 120;

export default function GoalCard({ goal, onEdit, onDelete, onStatusChange, onTasksChange }) {
    const [expanded, setExpanded] = useState(false);
    const [tasksExpanded, setTasksExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [linkedMom, setLinkedMom] = useState(null);

    useEffect(() => {
        if (!goal.linkedProgram) return;
        api.get('/momentum')
            .then(res => {
                const p = (res.data.programs || []).find(x => x.id === goal.linkedProgram);
                if (p) {
                    const stats = computeProgramStats(p, res.data.logs || []);
                    setLinkedMom({ p, ...stats });
                }
            })
            .catch(() => {});
    }, [goal.linkedProgram]);

    const isLong = goal.metadata?.length > META_LEN;

    const toggleTask = async (idx) => {
        if (!onTasksChange) return;
        const newTasks = goal.tasks.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t);
        setLoading(true);
        try { await onTasksChange(goal._id, newTasks); } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this goal permanently?')) return;
        setLoading(true);
        try { await onDelete(goal._id); } catch { setLoading(false); }
    };

    const handleStatus = async (status) => {
        setLoading(true);
        try { await onStatusChange(goal._id, status); } catch { setLoading(false); }
    };

    const statusCfg = {
        active: { label: 'Active', cls: 'badge-active' },
        paused: { label: 'Paused', cls: 'badge-paused' },
        completed: { label: 'Completed', cls: 'badge-completed' },
    };

    return (
        <div className={`goal-card ${goal.status !== 'active' ? 'goal-card-dim' : ''}`}>
            <div className="goal-card-top">
                <div className="goal-card-left">
                    <span className={`goal-type-badge ${goal.type === 'long_term' ? 'badge-long' : 'badge-short'}`}>
                        {goal.type === 'long_term' ? 'Long-term' : 'Short-term'}
                    </span>
                    <h3 className="goal-title">{goal.title}</h3>
                    {linkedMom && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--surface0)', padding: '2px 8px', borderRadius: '12px', marginTop: '6px', color: linkedMom.p.color }}>
                           {linkedMom.p.icon} {linkedMom.p.name} — <Flame size={12}/> {linkedMom.currentStreak} day streak
                        </div>
                    )}
                </div>
                <div className="goal-card-actions">
                    <span className={`goal-status-badge ${statusCfg[goal.status]?.cls}`}>
                        {statusCfg[goal.status]?.label}
                    </span>
                    <button id={`btn-edit-goal-${goal._id}`} className="btn btn-icon" onClick={() => onEdit(goal)} title="Edit">
                        <Pencil size={14} />
                    </button>
                    <button id={`btn-delete-goal-${goal._id}`} className="btn btn-icon" onClick={handleDelete} disabled={loading} style={{ color: 'var(--red)' }} title="Delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {goal.description && (
                <p className="goal-description">{goal.description}</p>
            )}

            {goal.workingDays?.length > 0 && (
                <div className="goal-days">
                    {goal.workingDays.map(d => (
                        <span key={d} className="day-chip">{DAY_ABBR[d] || d}</span>
                    ))}
                </div>
            )}

            {goal.targetDate && (
                <div className="goal-target-date">
                    🎯 Target: <strong>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</strong>
                </div>
            )}

            {goal.tasks && goal.tasks.length > 0 && (() => {
                const SHOW_PENDING = 5;
                const SHOW_DONE = 2;
                const pending = goal.tasks.map((t, i) => ({ ...t, _idx: i })).filter(t => !t.completed);
                const done    = goal.tasks.map((t, i) => ({ ...t, _idx: i })).filter(t => t.completed);
                const visiblePending = tasksExpanded ? pending : pending.slice(0, SHOW_PENDING);
                const visibleDone    = tasksExpanded ? done    : done.slice(0, SHOW_DONE);
                const visibleTasks   = [...visiblePending, ...visibleDone];
                const hiddenCount    = goal.tasks.length - visibleTasks.length;

                return (
                    <div className="goal-tasks-container">
                        <div className="goal-tasks-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--subtext0)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', background: 'var(--surface0)', padding: '4px 10px', borderRadius: '12px' }}>
                                {goal.tasks.filter(t => t.completed).length} / {goal.tasks.length}
                            </span>
                        </div>
                        <div className="goal-progress-bar" style={{ height: '8px', background: 'var(--surface0)', borderRadius: '999px', overflow: 'hidden', marginBottom: '20px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
                            <div className="goal-progress-fill" style={{ 
                                height: '100%', 
                                background: 'linear-gradient(90deg, var(--teal), var(--green))', 
                                width: `${Math.round((goal.tasks.filter(t => t.completed).length / goal.tasks.length) * 100)}%`, 
                                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                                boxShadow: '0 0 10px rgba(166, 227, 161, 0.5)' 
                            }} />
                        </div>
                        <div className="goal-task-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: hiddenCount > 0 || tasksExpanded ? '12px' : '24px' }}>
                            {visibleTasks.map((t) => (
                                <button 
                                    key={t._idx} 
                                    onClick={() => toggleTask(t._idx)}
                                    disabled={loading}
                                    className="custom-task-btn"
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                                        opacity: t.completed ? 0.5 : 1, transition: 'all 0.2s', textDecoration: t.completed ? 'line-through' : 'none'
                                    }}
                                    title="Toggle Task"
                                >
                                    <div style={{ color: t.completed ? 'var(--green)' : 'var(--overlay0)', flexShrink: 0, marginTop: '2px', transition: 'color 0.2s' }}>
                                        {t.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                    </div>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.4 }}>{t.title}</span>
                                </button>
                            ))}
                        </div>
                        {(hiddenCount > 0 || tasksExpanded) && (
                            <button
                                type="button"
                                onClick={() => setTasksExpanded(p => !p)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--surface0)', border: 'none',
                                    borderRadius: 20, padding: '5px 13px',
                                    fontSize: '0.78rem', fontWeight: 700,
                                    color: 'var(--subtext1)', cursor: 'pointer',
                                    marginBottom: 20, transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface0)'}
                            >
                                {tasksExpanded
                                    ? '▲ Show less'
                                    : `▼ Show ${hiddenCount} more task${hiddenCount !== 1 ? 's' : ''}`
                                }
                            </button>
                        )}
                    </div>
                );
            })()}

            {goal.metadata && (
                <div className="goal-meta-preview">
                    {expanded || !isLong ? goal.metadata : `${goal.metadata.slice(0, META_LEN)}…`}
                    {isLong && (
                        <button className="event-meta-toggle" onClick={() => setExpanded(p => !p)}>
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            )}

            {linkedMom && (
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--subtext0)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <span>Habit Consistency</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface0)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: linkedMom.p.color, width: `${Math.min(100, (linkedMom.currentStreak / 30) * 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                </div>
            )}

            {/* Status actions */}
            <div className="goal-status-actions">
                {goal.status !== 'active' && (
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                        onClick={() => handleStatus('active')} disabled={loading}>
                        <PlayCircle size={13} /> Resume
                    </button>
                )}
                {goal.status === 'active' && (
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                        onClick={() => handleStatus('paused')} disabled={loading}>
                        <PauseCircle size={13} /> Pause
                    </button>
                )}
                {goal.status !== 'completed' && (
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '5px 12px', color: 'var(--green)' }}
                        onClick={() => handleStatus('completed')} disabled={loading}>
                        <CheckCircle size={13} /> Mark Done
                    </button>
                )}
            </div>
        </div>
    );
}
