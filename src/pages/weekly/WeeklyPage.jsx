import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { format, startOfWeek, endOfWeek, getDay, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, Target, NotebookPen, Flame, Activity, Dumbbell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, YAxis } from 'recharts';
import { useMomentumData } from '../momentum/hooks/useMomentumData';

export default function WeeklyPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [workoutData, setWorkoutData] = useState(null);
  const [journalLogs, setJournalLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: momentumData, stats: momentumStats, isLoading: momentumLoading } = useMomentumData();

  const addWeeksLocal = (date, weeks) => {
    const d = new Date(date);
    d.setDate(d.getDate() + (weeks * 7));
    return d;
  };
  const subWeeksLocal = (date, weeks) => {
    const d = new Date(date);
    d.setDate(d.getDate() - (weeks * 7));
    return d;
  };

  const handlePrev = () => setCurrentDate(subWeeksLocal(currentDate, 1));
  const handleNext = () => setCurrentDate(addWeeksLocal(currentDate, 1));

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const isCurrentWeek = !isAfter(startOfWeek(new Date(), { weekStartsOn: 1 }), weekStart);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [glRes, woRes, joRes] = await Promise.all([
          axiosInstance.get('/goals'),
          axiosInstance.get('/workout/logs').catch(() => ({ data: { logs: [] }})),
          axiosInstance.get('/journal').catch(() => ({ data: [] }))
        ]);
        
        setGoals(glRes.data.goals || []);
        if (woRes.data.logs) setWorkoutData(woRes.data.logs); 
        setJournalLogs(joRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentDate]);

  if (loading || momentumLoading) return <div className="page-section"><div className="loading-spinner-wrap"><div className="spinner"></div></div></div>;

  // compute dates for the week
  const weekDatesStr = [];
  for (let i=0; i<7; i++) {
    weekDatesStr.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
  }

  // Helper date add/sub equivalent to date-fns addDays (simple to implement directly without importing addDays explicitly here)
  function addDays(date, days) {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
  }

  // --- Momentum Week Data ---
  let momAvgs = [];
  let momTotalScore = 0;
  let momPrograms = momentumStats?.programsWithStats || [];
  
  const momentumRenderData = momPrograms.map(p => {
    let possibleDays = 0;
    let hitDays = 0;
    let weekScore = 0;
    let intensities = [];
    const weekStrip = weekDatesStr.map(dStr => {
      const isApplicable = p.activeDays.includes(new Date(dStr).getDay());
      const s = p.stats.dailyScores[dStr];
      if (isApplicable) possibleDays++;
      if (isApplicable && s !== undefined) {
         hitDays++;
         weekScore += s;
      }
      
      const log = momentumData.logs.find(l => l.programId === p.id && l.date === dStr);
      if (log && log.intensity > 0) intensities.push(log.intensity);

      return { isApplicable, isLogged: s !== undefined, isRest: !isApplicable, isMissed: isApplicable && s === undefined };
    });

    const completionPct = possibleDays > 0 ? (hitDays / possibleDays) * 100 : 100;
    momAvgs.push(completionPct);
    const bestIntensity = intensities.length > 0 ? Math.max(...intensities) * 100 : 0;
    
    return { p, weekStrip, completionPct, weekScore, bestIntensity };
  });

  const momOverallCompletion = momAvgs.length > 0 ? momAvgs.reduce((a,b)=>a+b,0)/momAvgs.length : 100;

  // --- Journal Week Data ---
  let journalHitDays = 0;
  let journalWordCount = 0;
  let journalMoods = [];
  const journalChartData = weekDatesStr.map(dStr => {
    const entry = journalLogs.find(l => l.date === dStr);
    if (entry) {
        journalHitDays++;
        journalWordCount += (entry.body || '').split(' ').length;
        journalMoods.push(entry.mood);
        return { name: format(new Date(dStr), 'E'), mood: entry.mood };
    }
    return { name: format(new Date(dStr), 'E'), mood: null };
  });
  
  const avgMood = journalMoods.length > 0 ? (journalMoods.reduce((a,b)=>a+b,0)/journalMoods.length) : 0;
  const emojiMood = avgMood >= 4.5 ? '😄' : avgMood >= 3.5 ? '🙂' : avgMood >= 2.5 ? '😐' : avgMood >= 1.5 ? '😕' : '😞';

  // --- Workout Week Data ---
  let woCompletedDays = 0;
  let woTotalIntensity = 0;
  const woChartData = [];
  
  weekDatesStr.forEach(dStr => {
      const log = (workoutData || []).find(l => l.date === dStr);
      if (log && log.bodyParts && !log.bodyParts.includes('Rest')) {
          woCompletedDays++;
          woTotalIntensity += (log.intensity || 0);
          woChartData.push({ name: format(new Date(dStr), 'E'), intensity: log.intensity || 0 });
      } else {
          woChartData.push({ name: format(new Date(dStr), 'E'), intensity: 0 });
      }
  });

  const woScoreFactor = woCompletedDays > 0 ? Math.min((woCompletedDays / 4) * 100, 100) : (momOverallCompletion > 0 ? 50 : 0); // Assuming 4 days a week is 100%

  // --- SCORE CALCULATION ---
  // Momentum: 40% (avg completion)
  // Workout: 30% (completed vs 4 ideal days)
  // Journal: 20% (hit / 7)
  // Mood: 10% (avg mood / 5)
  const score = Math.round(
      (momOverallCompletion * 0.40) +
      (woScoreFactor * 0.30) + 
      ((journalHitDays / 7) * 100 * 0.20) + 
      ((avgMood / 5) * 100 * 0.10)
  );

  let letterGrade = 'F';
  if (score >= 90) letterGrade = 'A';
  else if (score >= 80) letterGrade = 'B';
  else if (score >= 70) letterGrade = 'C';
  else if (score >= 60) letterGrade = 'D';

  // Goals
  const weekGoals = goals.filter(g => g.status === 'active');

  // Summary String
  let summaryStr = [];
  if (momOverallCompletion > 80) summaryStr.push("Solid momentum!");
  else summaryStr.push("Momentum took a hit.");

  if (journalHitDays >= 5) summaryStr.push("Great logging consistency.");
  else if (journalHitDays === 0) summaryStr.push("Zero journal logs.");

  if (avgMood > 3) summaryStr.push("Mood trended upward 📈.");
  else if (avgMood > 0 && avgMood < 3) summaryStr.push("It was a challenging week mentally 📉.");

  if (woCompletedDays >= 4) summaryStr.push("Crushed the workouts 💪.");

  return (
    <div className="page-section" style={{ paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
           <h1 className="page-title"><BarChart3 size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }}/> Weekly Review</h1>
           <p className="page-subtitle">{format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
           <button className="btn-icon" onClick={handlePrev}><ChevronLeft /></button>
           <button className="btn-icon" disabled={isCurrentWeek} onClick={handleNext} style={{ opacity: isCurrentWeek ? 0.3 : 1 }}><ChevronRight /></button>
        </div>
      </div>

      <div className="weekly-top-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '24px', marginBottom: '24px' }}>
        {/* BIG SCORE */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--subtext0)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Week Score</h3>
           <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--mauve)', lineHeight: 1 }}>{score}<span style={{ fontSize: '2rem', color: 'var(--text)' }}>/100</span></div>
           <div style={{ display: 'inline-block', marginTop: '16px', padding: '4px 16px', background: 'var(--surface1)', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 800 }}>Grade {letterGrade}</div>
           
           <p style={{ marginTop: '24px', color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.5, background: 'var(--base)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface0)' }}>
             "{summaryStr.join(' ')}"
           </p>
        </div>

        {/* WORKOUT & JOURNAL SPLIT */}
        <div className="weekly-right-split" style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '24px' }}>
           {/* JOURNAL */}
           <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', gap: '24px' }}>
               <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><NotebookPen size={18} color="var(--yellow)"/><h3 style={{ fontWeight: 800 }}>Journal This Week</h3></div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--subtext0)' }}>Days Logged</span> <span style={{ fontWeight: 800 }}>{journalHitDays}/7</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--subtext0)' }}>Avg Mood</span> <span style={{ fontWeight: 800 }}>{avgMood > 0 ? emojiMood + ' ' + avgMood.toFixed(1) : '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--subtext0)' }}>Word Count</span> <span style={{ fontWeight: 800 }}>{journalWordCount}</span></div>
                 </div>
               </div>
               <div style={{ flex: 1, position: 'relative' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={journalChartData}>
                     <YAxis domain={[1,5]} hide />
                     <Tooltip cursor={{ fill: 'var(--surface0)' }} contentStyle={{ background: 'var(--mantle)', border: 'none', borderRadius: '8px' }}/>
                     <Line type="monotone" dataKey="mood" stroke="var(--yellow)" strokeWidth={3} dot={{ fill: 'var(--mantle)', strokeWidth: 2, r: 4 }} connectNulls />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
           </div>

           {/* WORKOUT */}
           <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', gap: '24px' }}>
               <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Dumbbell size={18} color="var(--blue)"/><h3 style={{ fontWeight: 800 }}>Workout This Week</h3></div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--subtext0)' }}>Days Trained</span> <span style={{ fontWeight: 800 }}>{woCompletedDays}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--subtext0)' }}>Total Intensity</span> <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{woTotalIntensity}</span></div>
                 </div>
               </div>
               <div style={{ flex: 1, position: 'relative' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={woChartData} margin={{ top: 10, bottom: 0, left: 0, right: 0 }}>
                     <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--subtext0)' }} axisLine={false} tickLine={false} />
                     <Bar dataKey="intensity" fill="var(--teal)" radius={[4,4,4,4]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
           </div>
        </div>
      </div>

      <div className="weekly-bottom-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1fr', gap: '24px' }}>
        {/* MOMENTUM LIST */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><Flame size={18} color="var(--teal)"/><h3 style={{ fontWeight: 800 }}>Momentum This Week</h3></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {momentumRenderData.length === 0 ? (
               <p style={{ color: 'var(--subtext0)', textAlign: 'center' }}>No habits running.</p>
            ) : momentumRenderData.map(d => (
              <div key={d.p.id} style={{ background: 'var(--base)', border: '1px solid var(--surface0)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '30%' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.p.icon}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.p.name}</span>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '4px' }}>
                    {d.weekStrip.map((day, idx) => (
                      <div key={idx} style={{ 
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: day.isRest ? 'var(--surface0)' : day.isLogged ? d.p.color : 'transparent',
                        border: day.isRest ? 'none' : `2px solid ${day.isMissed ? 'var(--red)' : d.p.color}`,
                        opacity: day.isMissed ? 0.5 : 1
                      }} />
                    ))}
                 </div>
                 
                 <div style={{ width: '25%', textAlign: 'right' }}>
                    <div style={{ fontWeight: 800 }}>{Math.round(d.completionPct)}% <span style={{ fontSize: '0.7rem', color: 'var(--subtext0)', fontWeight: 600 }}>CPL</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--subtext0)', fontWeight: 600, marginTop: '2px' }}>+{Math.round(d.weekScore)} pts</div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOALS */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><Target size={18} color="var(--red)"/><h3 style={{ fontWeight: 800 }}>Active Goals</h3></div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {weekGoals.length === 0 ? <p style={{ color: 'var(--subtext0)' }}>No active goals.</p> : weekGoals.map(g => {
               let dueSoon = false;
               if (g.targetDate) {
                  const daysToTarget = (new Date(g.targetDate) - new Date()) / (1000*60*60*24);
                  dueSoon = daysToTarget >= 0 && daysToTarget <= 7;
               }

               return (
                 <div key={g._id} style={{ padding: '16px', background: 'var(--base)', border: `1px solid ${dueSoon ? 'var(--red)' : 'var(--surface0)'}`, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.title}</span>
                       {dueSoon && <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--red)', background: 'rgba(243, 139, 168, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Due Soon ⚠️</span>}
                    </div>
                    {g.targetDate && <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)', marginTop: '8px' }}>Target: {format(new Date(g.targetDate), 'MMM d, yyyy')}</div>}
                 </div>
               );
             })}
           </div>
        </div>

      </div>

    </div>
  );
}
