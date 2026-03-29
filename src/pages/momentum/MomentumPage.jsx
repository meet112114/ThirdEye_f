import React, { useState } from 'react';
import { useMomentumData } from './hooks/useMomentumData';
import { Flame, Plus, X, ChevronLeft, Activity, Target, TrendingUp, Trash2, Pencil } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { format, isSameDay, addDays, getDay, isBefore, startOfMonth, startOfToday, endOfMonth, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import '../../momentum.css'; // Native standard CSS for Momentum

export default function MomentumPage() {
  const { data, isLoading, stats, addProgram, updateProgram, deleteProgram, logDay } = useMomentumData();
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalProgram, setEditModalProgram] = useState(null);
  const [logModalData, setLogModalData] = useState(null);
  const [moodLogs, setMoodLogs] = useState([]);
  const [goals, setGoals] = useState([]);

  React.useEffect(() => {
     axiosInstance.get('/journal').then(res => setMoodLogs(res.data)).catch(()=>{});
     axiosInstance.get('/goals').then(res => setGoals(res.data.goals || [])).catch(()=>{});
  }, []);

  if (isLoading) return (
    <div className="page-section">
      <div className="loading-spinner-wrap"><div className="spinner"></div></div>
    </div>
  );

  const activeProgram = activeProgramId ? stats.programsWithStats.find(p => p.id === activeProgramId) : null;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="page-section" style={{ paddingBottom: '120px' }}>
      {/* Header */}
      {!activeProgram ? (
        <div className="page-header" style={{ borderBottom: 'none', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Momentum</h1>
            <p className="page-subtitle">Track habits, build streaks, maintain your momentum.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} /> New Program
          </button>
        </div>
      ) : (
        <div className="page-header" style={{ borderBottom: 'none', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-icon" onClick={() => setActiveProgramId(null)} style={{ background: 'var(--surface0)', padding: '12px', borderRadius: '12px' }}>
              <ChevronLeft size={24} color="var(--text)" />
            </button>
            <div>
              <h1 className="page-title">{activeProgram.name}</h1>
              <p className="page-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800, color: activeProgram.color }}>
                {activeProgram.type} Habit
              </p>
            </div>
          </div>
          <button className="btn" style={{ background: 'rgba(137, 180, 250, 0.1)', color: 'var(--blue)', marginRight: '8px' }} onClick={() => { const raw = data.programs.find(p => p.id === activeProgram.id); setEditModalProgram(raw); }}>
             <Pencil size={16} /> Edit
          </button>
          <button className="btn" style={{ background: 'rgba(243, 139, 168, 0.1)', color: 'var(--red)' }} onClick={() => { deleteProgram(activeProgram.id); setActiveProgramId(null); }}>
             <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* Main Content */}
      {!activeProgram ? (
        <>
          {/* Dashboard Summary Bento */}
          <div className="momentum-bento">
            <div className="momentum-hero-card">
              <div>
                <span className="goal-type-badge badge-long" style={{ background: 'rgba(148, 226, 213, 0.1)', color: 'var(--teal)' }}>OVERALL SCORE</span>
                <div className="momentum-score">
                  {stats.overallScore} 
                </div>
                <p style={{ color: 'var(--subtext0)', marginTop: '8px', fontWeight: 600 }}>
                  {stats.activeStreakCount} active programs. {stats.overallScore > 0 ? "You're building momentum!" : "Time to start building momentum."}
                </p>
              </div>
            </div>

            <div className="momentum-chart-container" style={{ margin: 0 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text)' }}>Weekly Performance</h3>
              <div style={{ height: '200px', width: '100%' }}>
                 <WeeklyChart stats={stats} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '48px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Programs</h2>
             <div className="section-count">{stats.programsWithStats.length}</div>
          </div>

          <div className="goals-grid">
            {stats.programsWithStats.map(p => (
               <div key={p.id} className="momentum-program-card" onClick={() => setActiveProgramId(p.id)}>
                 <div className="momentum-program-header">
                    <div className="momentum-program-icon" style={{ color: p.color }}>{p.icon}</div>
                    <div className="goal-status-badge badge-active" style={{ background: 'var(--surface0)', color: 'var(--text)' }}>
                        <Flame size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: p.stats.currentStreak > 0 ? p.color : 'inherit' }} />
                        {p.stats.currentStreak} Day Streak
                    </div>
                 </div>
                 <h2 className="momentum-program-title">{p.name}</h2>
                 
                 <div className="momentum-program-stats">
                    <div className="momentum-stat-group">
                       <span className="momentum-stat-label">Score</span>
                       <span className="momentum-stat-value">{p.stats.totalScore}</span>
                    </div>
                    {/* Tiny week preview */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                       {[6,5,4,3,2,1,0].map(diff => {
                         const d = format(subDays(new Date(), diff), 'yyyy-MM-dd');
                         const s = p.stats.dailyScores[d];
                         const isActive = p.activeDays.includes(getDay(subDays(new Date(), diff)));
                         if (!isActive) return <div key={d} style={{ width: '8px', height: '24px', background: 'var(--base)', borderRadius: '4px' }} />;
                         return (
                           <div key={d} style={{ width: '8px', height: '24px', borderRadius: '4px', background: s > 0 ? p.color : s < 0 ? 'var(--red)' : 'var(--surface0)', opacity: s > 0 ? 1 : 0.5 }} />
                         );
                       })}
                    </div>
                 </div>
               </div>
            ))}
          </div>
        </>
      ) : (
        <ProgramDetail 
          program={activeProgram} 
          logs={data.logs.filter(l => l.programId === activeProgram.id)}
          onLog={(prog, date) => setLogModalData({ prog, date })}
          moodLogs={moodLogs}
          goals={goals}
        />
      )}

      {/* Modals using standard Third Eye Modal Classes */}
      {isCreateModalOpen && <CreateOrEditProgramModal onClose={() => setIsCreateModalOpen(false)} onSave={addProgram} />}
      {editModalProgram && (
        <CreateOrEditProgramModal 
          initialData={editModalProgram}
          onClose={() => setEditModalProgram(null)} 
          onSave={(updated) => { updateProgram(editModalProgram.id, updated); setEditModalProgram(null); }} 
        />
      )}
      {logModalData && (
        <LogModal 
          program={logModalData.prog} 
          date={logModalData.date} 
          existingLog={data.logs.find(l => l.programId === logModalData.prog.id && l.date === logModalData.date)}
          onClose={() => setLogModalData(null)} 
          onSave={logDay} 
        />
      )}
    </div>
  );
}

function WeeklyChart({ stats }) {
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dStr = format(d, 'yyyy-MM-dd');
    const dayObj = { name: format(d, 'EEE') };
    stats.programsWithStats.forEach(p => {
      const s = p.stats.dailyScores[dStr] || 0;
      dayObj[p.name] = s > 0 ? s : 0;
    });
    chartData.push(dayObj);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--subtext0)', fontSize: 12, fontWeight: 600 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--subtext0)', fontSize: 12, fontWeight: 600 }} />
        <Tooltip cursor={{ fill: 'var(--surface0)' }} contentStyle={{ backgroundColor: 'var(--mantle)', borderColor: 'var(--surface1)', borderRadius: '12px', color: 'var(--text)', fontWeight: 600 }} />
        {stats.programsWithStats.map(p => (
          <Bar key={p.id} dataKey={p.name} stackId="a" fill={p.color} radius={[4, 4, 4, 4]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function ProgramDetail({ program, logs, onLog, moodLogs = [], goals = [] }) {
  const [showMoodOverlay, setShowMoodOverlay] = useState(false);
  const p = program;
  const { stats } = p;
  
  const linkedGoals = goals.filter(g => g.linkedProgram === program.id);

  const getMoodColor = (mood) => {
     if(mood===1) return 'var(--red)';
     if(mood===2) return '#fab387'; // Peach/Orange
     if(mood===3) return 'var(--yellow)';
     if(mood===4) return 'var(--teal)';
     if(mood===5) return 'var(--green)';
     return 'transparent';
  };
  
  const today = new Date();
  const startDay = startOfMonth(today);
  const endDay = endOfMonth(today);
  const startDayIdx = getDay(startDay);
  
  const days = [];
  for(let i = 0; i < startDayIdx; i++) days.push(null);
  let curr = startDay;
  while(isBefore(curr, endDay) || isSameDay(curr, endDay)) {
    days.push(curr);
    curr = addDays(curr, 1);
  }

  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div>
       <div className="momentum-detail-stats">
         <div className="momentum-stat-box">
           <span className="momentum-stat-label"><Flame size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Longest Streak</span>
           <span className="momentum-stat-value">{stats.longestStreak}</span>
         </div>
         <div className="momentum-stat-box">
           <span className="momentum-stat-label"><Activity size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Completion Rate</span>
           <span className="momentum-stat-value">{Math.round(stats.completionRate * 100)}%</span>
         </div>
         <div className="momentum-stat-box">
           <span className="momentum-stat-label"><Target size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Avg Intensity</span>
           <span className="momentum-stat-value">{Math.round(stats.avgIntensity * 100)}%</span>
         </div>
         <div className="momentum-stat-box">
           <span className="momentum-stat-label"><TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Total Score</span>
           <span className="momentum-stat-value" style={{ color: p.color }}>{stats.totalScore}</span>
         </div>
       </div>

       <div className="momentum-calendar">
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{format(today, 'MMMM yyyy')} Log</h3>
             <button 
                onClick={() => setShowMoodOverlay(!showMoodOverlay)}
                style={{ fontSize: '0.8rem', padding: '6px 12px', background: showMoodOverlay ? 'var(--mauve)' : 'transparent', color: showMoodOverlay ? 'var(--crust)' : 'var(--text)', border: `1px solid ${showMoodOverlay ? 'var(--mauve)' : 'var(--surface0)'}`, borderRadius: '999px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
             >
                {showMoodOverlay ? 'Hide Mood Overlay' : 'Show Mood Overlay'}
             </button>
           </div>
           <span className="goal-status-badge badge-active" style={{ background: 'var(--surface0)', color: 'var(--text)' }}>Tap a day to log</span>
         </div>
         
         <div className="momentum-calendar-grid" style={{ marginBottom: '8px' }}>
           {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="momentum-cal-header">{d}</div>)}
         </div>
         <div className="momentum-calendar-grid">
           {days.map((d, i) => {
             if (!d) return <div key={`pad-${i}`} className="momentum-day-tile" style={{ visibility: 'hidden' }} />;
             const dStr = format(d, 'yyyy-MM-dd');
             const isApplicable = p.activeDays.includes(getDay(d));
             const isPastOrToday = isBefore(d, startOfToday()) || isSameDay(d, startOfToday());
             const log = logs.find(l => l.date === dStr);
             const isToday = dStr === todayStr;
             
             let tileClass = 'momentum-day-tile ';
             let bgColor = 'transparent';
             let bgOpacity = 0;
             let textColor = 'var(--subtext1)';
             let borderColor = 'var(--surface0)';

             if (!isApplicable) {
               tileClass += 'disabled ';
               borderColor = 'transparent';
             } else if (isPastOrToday) {
               if (log) {
                 if (log.isFreeze) {
                    bgColor = 'var(--surface1)';
                    bgOpacity = 1;
                    textColor = 'var(--text)';
                 } else {
                    tileClass += 'logged ';
                    bgColor = p.color;
                    bgOpacity = Math.max(0.2, log.intensity);
                    textColor = log.intensity > 0.4 ? '#111111' : 'var(--text)';
                    borderColor = p.color;
                    if (log.intensity === 0) {
                        tileClass += 'missed ';
                        bgColor = ''; bgOpacity = 0; textColor = 'var(--red)';
                        borderColor = 'rgba(243, 139, 168, 0.3)';
                    }
                 }
               } else {
                 if (!isToday) {
                   tileClass += 'missed ';
                   textColor = 'var(--red)';
                   borderColor = 'rgba(243, 139, 168, 0.3)';
                 } else {
                   tileClass += 'today ';
                   textColor = p.color;
                   borderColor = p.color;
                 }
               }
             }

             let extraStyle = { border: `1px solid ${borderColor}` };
             if (showMoodOverlay) {
                const moodLog = moodLogs.find(m => m.date === dStr);
                if (moodLog) {
                   extraStyle.border = `2px solid ${getMoodColor(moodLog.mood)}`;
                   extraStyle.boxShadow = `0 0 10px ${getMoodColor(moodLog.mood)}40`;
                }
             }

             return (
               <button 
                 key={dStr} 
                 onClick={() => { if(isApplicable && isPastOrToday) onLog(p, dStr); }}
                 className={tileClass}
                 style={{ position: 'relative', overflow: 'hidden', padding: 0, ...extraStyle }}
                 disabled={!isApplicable || (!isPastOrToday && !isToday)}
               >
                 <div style={{ position: 'absolute', inset: 0, backgroundColor: bgColor, opacity: bgOpacity, zIndex: 0 }} />
                 <span style={{ zIndex: 1, position: 'relative', color: textColor, fontWeight: 800 }}>
                    {log && log.isFreeze ? '❄️' : d.getDate()}
                 </span>
               </button>
             );
           })}
         </div>
       </div>

       {linkedGoals.length > 0 && (
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Linked Goals</h3>
             {linkedGoals.map(g => (
                <div key={g._id} style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{g.title}</span>
                         <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px', background: 'var(--surface1)', borderRadius: '4px' }}>{g.status}</span>
                       </div>
                       {g.targetDate && <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)' }}>Target Date: {format(new Date(g.targetDate), 'MMM d, yyyy')}</div>}
                    </div>
                    <Link to="/goals" className="btn btn-primary" style={{ background: 'var(--surface1)', color: 'var(--text)' }}>
                       View Goal →
                    </Link>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}

function LogModal({ program, date, existingLog, onClose, onSave }) {
  const [intensity, setIntensity] = useState(existingLog ? existingLog.intensity : 1.0);
  const [note, setNote] = useState(existingLog?.note || '');
  const [isFreeze, setIsFreeze] = useState(existingLog?.isFreeze || false);

  const isBreak = program.type === 'break';
  const intensityLabels = isBreak 
    ? { 0: 'Relapsed', 0.25: 'Struggled', 0.5: 'Okay', 0.75: 'Good', 1: 'Resisted' }
    : { 0: 'None', 0.25: 'Low', 0.5: 'Good', 0.75: 'Great', 1: 'Perfect' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '32px' }}>
        <div className="modal-header">
          <h2>Log {format(new Date(date), 'MMM d, yyyy')}</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            { isBreak ? 'Resistance Level' : 'Intensity'}
            <span style={{ color: program.color, fontWeight: 800 }}>{isFreeze ? 'Frozen ❄️' : intensityLabels[intensity]}</span>
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.25" 
            value={intensity} 
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="momentum-slider"
            style={{ '--text': program.color }}
            disabled={isFreeze}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--subtext0)', fontWeight: 600 }}>
             <span>{intensityLabels[0]}</span>
             <span>{intensityLabels[1]}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea 
            placeholder="How did it go today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface0)', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
           <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Use Freeze Day</span>
           <button 
             onClick={() => setIsFreeze(!isFreeze)}
             style={{ width: '48px', height: '24px', borderRadius: '12px', background: isFreeze ? 'var(--blue)' : 'var(--surface1)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'var(--transition)' }}
           >
              <div style={{ position: 'absolute', top: '4px', left: isFreeze ? '28px' : '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text)', transition: 'var(--transition)' }} />
           </button>
        </div>

        <button 
          onClick={() => {
            onSave({ programId: program.id, date, intensity: isFreeze ? 0 : intensity, note, isFreeze });
            onClose();
          }}
          className="btn"
          style={{ width: '100%', padding: '16px', background: program.color, color: '#111111', fontSize: '1.05rem', fontWeight: 800 }}
        >
          Save Log
        </button>
      </div>
    </div>
  );
}

function CreateOrEditProgramModal({ onClose, onSave, initialData = null }) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [icon, setIcon] = useState(initialData?.icon || '💫');
  const [type, setType] = useState(initialData?.type || 'build');
  const [activeDays, setActiveDays] = useState(initialData?.activeDays || [1,2,3,4,5]);
  const [color, setColor] = useState(initialData?.color || 'var(--teal)');

  const COLORS = ['var(--teal)', 'var(--blue)', 'var(--mauve)', 'var(--red)', 'var(--green)', '#FFD166'];
  const DAYS = [{ l:'Su', v:0 }, { l:'Mo', v:1 }, { l:'Tu', v:2 }, { l:'We', v:3 }, { l:'Th', v:4 }, { l:'Fr', v:5 }, { l:'Sa', v:6 }];

  const toggleDay = (v) => {
    if (activeDays.includes(v)) setActiveDays(activeDays.filter(d => d !== v));
    else setActiveDays([...activeDays, v]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Program' : 'Create Program'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
           <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
              <label>Icon</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} style={{ textAlign: 'center', fontSize: '1.5rem', padding: '8px' }} />
           </div>
           <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Program Name</label>
              <input type="text" placeholder="E.g., Workout, Reading" value={name} onChange={e => setName(e.target.value)} />
           </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
           <label>Type of Habit</label>
           <div className="toggle-group">
               <button onClick={() => setType('build')} className={`toggle-btn ${type === 'build' ? 'active' : ''}`}>Build Habit</button>
               <button onClick={() => setType('break')} className={`toggle-btn ${type === 'break' ? 'active' : ''}`}>Break Habit</button>
           </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label>Accent Color</label>
          <div style={{ display: 'flex', gap: '12px' }}>
             {COLORS.map(c => (
               <button 
                 key={c} onClick={() => setColor(c)} 
                 style={{ width: '36px', height: '36px', borderRadius: '50%', background: c, border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', transition: 'transform 0.2s', transform: color === c ? 'scale(1.1)' : 'scale(1)' }} 
               />
             ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label>Active Days</label>
          <div className="working-days-row">
            {DAYS.map(d => (
              <button 
                key={d.v} onClick={() => toggleDay(d.v)}
                className={`day-toggle-btn ${activeDays.includes(d.v) ? 'active' : ''}`}
                style={activeDays.includes(d.v) ? { background: color, borderColor: color, color: '#111111' } : {}}
              >
                {d.l}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              disabled={!name.trim() || activeDays.length === 0}
              onClick={() => {
                const payload = isEdit
                  ? { name: name.trim(), icon, type, color, activeDays }
                  : { name: name.trim(), icon, type, color, activeDays, createdAt: format(new Date(), 'yyyy-MM-dd') };
                onSave(payload);
                onClose();
              }}
              className="btn btn-primary"
              style={{ background: color, color: '#111111', fontWeight: 800 }}
            >
              {isEdit ? 'Save Changes' : 'Create Program'}
            </button>
        </div>
      </div>
    </div>
  );
}
