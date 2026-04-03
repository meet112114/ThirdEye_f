import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format, subDays, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar, Flame, Activity, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
const BODY_PARTS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Legs',
  'Glutes',
  'Calves',
  'Abs',
  'Cardio',
  'Rest'
];
const INTENSITY_SCORES = [
    { value: 1, label: 'Very Light', color: 'var(--green)' },
    { value: 2, label: 'Light', color: '#a6e3a1' },
    { value: 3, label: 'Moderate', color: 'var(--yellow)' },
    { value: 4, label: 'Hard', color: 'var(--teal)' },
    { value: 5, label: 'Maximum', color: 'var(--red)' }
];

export default function WorkoutPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states for currentDate
    const [selectedParts, setSelectedParts] = useState([]);
    const [intensity, setIntensity] = useState(0);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/workout/logs');
            setLogs(res.data.logs || []);
        } catch (err) {
            toast.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Effect to update form state when date changes
    useEffect(() => {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const existing = logs.find(l => l.date === dateStr);
        if (existing) {
            setSelectedParts(existing.bodyParts || []);
            setIntensity(existing.intensity || 0);
            setNotes(existing.notes || '');
        } else {
            setSelectedParts([]);
            setIntensity(0);
            setNotes('');
        }
    }, [currentDate, logs]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await api.post('/workout/log', {
                date: dateStr,
                bodyParts: selectedParts,
                intensity,
                notes
            });
            toast.success('Workout logged!');
            
            // Update local state without fetching again
            const updatedLogs = [...logs];
            const idx = updatedLogs.findIndex(l => l.date === dateStr);
            if (idx >= 0) updatedLogs[idx] = res.data.log;
            else updatedLogs.push(res.data.log);
            setLogs(updatedLogs);

        } catch (err) {
            toast.error('Failed to save log');
        } finally {
            setSaving(false);
        }
    };

    const togglePart = (part) => {
        if (part === 'Rest') {
            if (selectedParts.includes('Rest')) setSelectedParts([]);
            else setSelectedParts(['Rest']);
            return;
        }
        
        let newParts = [...selectedParts];
        if (newParts.includes('Rest')) newParts = newParts.filter(p => p !== 'Rest');

        if (newParts.includes(part)) {
            newParts = newParts.filter(p => p !== part);
        } else {
            newParts.push(part);
        }
        setSelectedParts(newParts);
    };

    const goPrevDay = () => setCurrentDate(d => subDays(new Date(d), 1));
    const goNextDay = () => {
        const next = addDays(new Date(currentDate), 1);
        if (!isAfter(next, new Date()) || isSameDay(next, new Date())) {
            setCurrentDate(next);
        }
    };

    const today = new Date();
    const isFutureDate = (d) => isAfter(d, today) && !isSameDay(d, today);

    // Calculate Week View dates
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(weekStart), i));

    // Calculate Month View (Current Month)
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate Stats
    let totalWorkouts = logs.filter(l => l.intensity > 0 && !l.bodyParts.includes('Rest')).length;
    let currentStreak = 0;
    let checkDate = new Date();
    while (true) {
        const dStr = format(checkDate, 'yyyy-MM-dd');
        const log = logs.find(l => l.date === dStr);
        if (log && ((log.intensity > 0 && !log.bodyParts.includes('Rest')) || log.bodyParts.includes('Rest'))) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else {
            if (isSameDay(checkDate, today) && currentStreak === 0) {
                checkDate = subDays(checkDate, 1);
                continue;
            }
            break;
        }
    }

    if (loading) return <div className="page-section"><div className="loading-spinner-wrap"><div className="spinner"></div></div></div>;

    return (
        <div className="page-section" style={{ paddingBottom: '120px', maxWidth: '1200px' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                   <h1 className="page-title"><Dumbbell size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-4px' }}/> Daily Workout Log</h1>
                   <p className="page-subtitle">Track your training days, rest, and intensity.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                
                {/* LOGGER */}
                <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <button className="btn-icon" onClick={goPrevDay}><ChevronLeft /></button>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                            {format(currentDate, 'EEEE, MMM d, yyyy')}
                        </h2>
                        <button className="btn-icon" onClick={goNextDay} disabled={isSameDay(currentDate, today)} style={{ opacity: isSameDay(currentDate, today) ? 0.3 : 1 }}>
                            <ChevronRight />
                        </button>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Body Parts Trained</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {BODY_PARTS.map(part => {
                                const active = selectedParts.includes(part);
                                return (
                                    <button 
                                        key={part}
                                        onClick={() => togglePart(part)}
                                        style={{ 
                                            padding: '8px 16px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--surface0)',
                                            background: active ? (part === 'Rest' ? 'var(--surface2)' : 'rgba(137, 180, 250, 0.15)') : 'transparent',
                                            color: active ? (part === 'Rest' ? 'var(--text)' : 'var(--blue)') : 'var(--subtext0)',
                                            borderColor: active ? (part === 'Rest' ? 'var(--surface2)' : 'rgba(137, 180, 250, 0.4)') : 'var(--surface0)',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {part}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Intensity</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {INTENSITY_SCORES.map(score => {
                                const active = intensity === score.value;
                                return (
                                    <button
                                        key={score.value}
                                        onClick={() => setIntensity(score.value)}
                                        style={{
                                            flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '1.1rem',
                                            background: active ? score.color : 'var(--surface0)',
                                            color: active ? 'var(--crust)' : 'var(--subtext1)',
                                            cursor: 'pointer', transition: 'all 0.2s', opacity: (intensity > 0 && !active) ? 0.5 : 1
                                        }}
                                        title={score.label}
                                    >
                                        {score.value}
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => setIntensity(0)} 
                                style={{
                                    padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px dashed var(--surface2)', 
                                    color: 'var(--subtext0)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
                                }}>
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did it feel? PRs?"
                            style={{ width: '100%', minHeight: '100px', marginTop: '8px', resize: 'vertical' }}
                        />
                    </div>

                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '24px', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Log'}
                    </button>
                </div>

                {/* VISUALIZATIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* WEEK GRID */}
                    <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Calendar size={18} color="var(--mauve)"/><h3 style={{ fontWeight: 800 }}>This Week</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            {weekDates.map((d) => {
                                const dStr = format(d, 'yyyy-MM-dd');
                                const log = logs.find(l => l.date === dStr);
                                let color = 'var(--surface0)';
                                if (log) {
                                    if (log.bodyParts.includes('Rest')) color = 'var(--surface1)';
                                    else if (log.intensity) {
                                        const cObj = INTENSITY_SCORES.find(c => c.value === log.intensity);
                                        if (cObj) color = cObj.color;
                                    } else {
                                        color = 'var(--blue)'; // Fallback if no intensity
                                    }
                                }
                                const isToday = isSameDay(d, today);
                                const isSelected = isSameDay(d, currentDate);
                                const isFuture = isFutureDate(d);

                                return (
                                    <div 
                                        key={dStr} 
                                        onClick={() => !isFuture && setCurrentDate(d)}
                                        style={{ 
                                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                                            padding: '12px 4px', borderRadius: '12px', background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                                            cursor: isFuture ? 'not-allowed' : 'pointer', border: isToday ? '1px dashed var(--surface2)' : '1px solid transparent',
                                            opacity: isFuture ? 0.4 : 1
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isToday ? 'var(--text)' : 'var(--subtext0)' }}>{format(d, 'EE')}</span>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: color, boxShadow: log && !log.bodyParts.includes('Rest') ? `0 4px 12px ${color}40` : 'none' }}></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* MONTH GRID & STATS */}
                    <div className="workout-month-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        
                        {/* STATS */}
                        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                <TrendingUp size={18} color="var(--green)"/><h3 style={{ fontWeight: 800 }}>Your Stats</h3>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'rgba(249, 226, 175, 0.1)', color: 'var(--yellow)', padding: '12px', borderRadius: '12px' }}><Flame size={24}/></div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{currentStreak} <span style={{ fontSize: '1rem', color: 'var(--subtext0)' }}>Days</span></div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'rgba(137, 180, 250, 0.1)', color: 'var(--blue)', padding: '12px', borderRadius: '12px' }}><Activity size={24}/></div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Completed</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{totalWorkouts} <span style={{ fontSize: '1rem', color: 'var(--subtext0)' }}>Workouts</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MONTH GRID */}
                        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Calendar size={18} color="var(--blue)"/><h3 style={{ fontWeight: 800 }}>{format(today, 'MMMM yyyy')}</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayName, idx) => (
                                    <div key={'header'+idx} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--subtext0)', fontWeight: 700, paddingBottom: '4px' }}>{dayName}</div>
                                ))}
                                
                                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                                    <div key={'empty'+i}></div>
                                ))}

                                {monthDates.map(d => {
                                    const dStr = format(d, 'yyyy-MM-dd');
                                    const log = logs.find(l => l.date === dStr);
                                    let bg = 'var(--surface0)';
                                    
                                    if (log && !log.bodyParts.includes('Rest') && log.intensity) {
                                        // Use rgba to vary intensity without affecting element opacity or borders
                                        const alphaMap = { 1: 0.35, 2: 0.52, 3: 0.68, 4: 0.84, 5: 1.0 };
                                        const alpha = alphaMap[log.intensity] || 0.5;
                                        bg = `rgba(137, 180, 250, ${alpha})`; // blue with variable alpha
                                    } else if (log && log.bodyParts.includes('Rest')) {
                                        bg = 'var(--surface2)';
                                    }

                                    const isToday = isSameDay(d, today);
                                    const isFuture = isFutureDate(d);
                                    const isSelected = isSameDay(d, currentDate);

                                    return (
                                        <div 
                                            key={dStr} 
                                            onClick={() => !isFuture && setCurrentDate(d)}
                                            title={`${format(d, 'MMM d, yyyy')}: ${log ? (log.bodyParts.join(', ') + ' - Intensity: ' + (log.intensity || '-')) : (isFuture ? 'Future' : 'No log')}`}
                                            style={{ 
                                                aspectRatio: '1', borderRadius: '4px', 
                                                background: bg,
                                                opacity: isFuture ? 0.3 : 1,
                                                cursor: isFuture ? 'not-allowed' : 'pointer', 
                                                border: isSelected
                                                    ? '2px solid var(--text)'
                                                    : isToday
                                                        ? '2px solid var(--accent)'
                                                        : '2px solid transparent',
                                                position: 'relative',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {isToday && (
                                                <div style={{ 
                                                    position: 'absolute', bottom: '2px', left: '50%', 
                                                    transform: 'translateX(-50%)', width: '4px', height: '4px', 
                                                    borderRadius: '50%', background: 'var(--accent)' 
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--subtext0)' }}>
                                Less <div style={{width: 10, height: 10, background:'var(--surface0)', borderRadius:2}}></div>
                                <div style={{width: 10, height: 10, background:'var(--blue)', opacity: 0.36, borderRadius:2}}></div>
                                <div style={{width: 10, height: 10, background:'var(--blue)', opacity: 0.68, borderRadius:2}}></div>
                                <div style={{width: 10, height: 10, background:'var(--blue)', opacity: 1, borderRadius:2}}></div> More
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .btn-primary:not(:disabled):hover { filter: brightness(1.2); transform: translateY(-2px); box-shadow: 0 8px 20px var(--accent-glow); }
            `}</style>
        </div>
    );
}
