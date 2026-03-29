import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format, getDay, isBefore, isSameDay, startOfToday } from 'date-fns';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, LineChart, Line, YAxis } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { Flame, CheckCircle, Circle, MapPin, CalendarDays, Target, Dumbbell } from 'lucide-react';
import { useMomentumData } from '../momentum/hooks/useMomentumData';

const QUOTES = [
  "The secret to getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "You don't have to be great to start, but you have to start to be great.",
  "Discipline is choosing between what you want now and what you want most.",
  "Motivation gets you going, but discipline keeps you growing.",
  "Small daily improvements over time lead to stunning results.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your future is created by what you do today, not tomorrow.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only bad workout is the one that didn't happen.",
  "Doubt kills more dreams than failure ever will.",
  "If it doesn't challenge you, it doesn't change you.",
  "Focus on the step in front of you, not the whole staircase.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Do something today that your future self will thank you for.",
  "A river cuts through rock not because of its power but its persistence.",
  "Consistency is what transforms average into excellence.",
  "Action is the foundational key to all success.",
  "Make today your masterpiece.",
  "Every champion was once a contender that refused to give up."
];

export default function TodayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [workoutData, setWorkoutData] = useState(null);
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Momentum context
  const { data: momentumData, stats: momentumStats, isLoading: momentumLoading } = useMomentumData();

  useEffect(() => {
    async function fetchData() {
      try {
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
        
        const [evRes, glRes, woRes, joRes] = await Promise.all([
          axiosInstance.get(`/events?start=${encodeURIComponent(todayStart.toISOString())}&end=${encodeURIComponent(todayEnd.toISOString())}`).catch(() => ({ data: { events: [] }})),
          axiosInstance.get('/goals').catch(() => ({ data: { goals: [] }})),
          axiosInstance.get('/workout/logs').catch(() => ({ data: { logs: [] }})),
          axiosInstance.get('/journal').catch(() => ({ data: [] }))
        ]);
        
        setEvents(evRes.data.events || []);
        setGoals(glRes.data.goals || []);
        if (woRes.data.logs) {
            setWorkoutData(woRes.data.logs); 
        }
        setMoodLogs(joRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  // Process Events
  const todaysEvents = [...events].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Process Goals
  const activeGoals = goals.filter(g => g.status === 'active');

  // Process Momentum
  const momentumToday = momentumStats?.programsWithStats?.filter(p => p.activeDays.includes(getDay(new Date()))) || [];
  const momentumDoneCount = momentumToday.reduce((acc, p) => acc + (p.stats.dailyScores[todayStr] !== undefined ? 1 : 0), 0);
  const allMomentumDone = momentumToday.length > 0 && momentumDoneCount === momentumToday.length;

  // Process Workout
  let workoutTodayStr = "Nothing logged";
  let workoutLogged = false;
  let exCount = 0; // Keeping for interface compat but repurposing to intensity or similar
  
  if (workoutData) {
      const todayLog = workoutData.find(l => l.date === todayStr);
      if (todayLog) {
          workoutLogged = true;
          if (todayLog.bodyParts && todayLog.bodyParts.includes('Rest')) {
              workoutTodayStr = "Rest Day";
          } else {
              workoutTodayStr = todayLog.bodyParts && todayLog.bodyParts.length > 0 
                  ? todayLog.bodyParts.join(', ') 
                  : 'Workout Logged';
              exCount = todayLog.intensity || 0;
          }
      }
  }

  // Compute Today Score
  let score = 0;
  if (momentumToday.length > 0) score += (momentumDoneCount / momentumToday.length) * 40;
  else score += 40; // free points if no habits

  if (workoutLogged && workoutTodayStr !== "Rest Day") score += 30;
  else if (workoutTodayStr === "Rest Day") score += 30; // Free points for taking planned rest

  if (activeGoals.length > 0) score += 30; // Simply having active goals = 30 pts

  score = Math.round(score);

  // Mood data preparation
  const last7Days = [];
  let yesterdayMood = null;

  const subDaysLocal = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
  };

  for (let i=6; i>=0; i--) {
      const d = format(subDaysLocal(new Date(), i), 'yyyy-MM-dd');
      const entry = moodLogs.find(l => l.date === d);
      last7Days.push({ date: format(subDaysLocal(new Date(), i), 'EEE'), mood: entry ? entry.mood : null });
      if (i === 1 && entry) yesterdayMood = entry.mood;
  }

  if (loading || momentumLoading) return (
    <div className="page-section">
      <div className="loading-spinner-wrap"><div className="spinner"></div></div>
    </div>
  );

  return (
    <div className="page-section" style={{ paddingBottom: '120px' }}>
      <div style={{ marginBottom: '40px' }}>
         <h1 className="page-title" style={{ fontSize: '2rem' }}>{greeting}, {user?.name || user?.email?.split('@')?.[0] || 'User'} 👋</h1>
         <p className="page-subtitle" style={{ fontSize: '1.25rem', marginTop: '8px', color: 'var(--text)' }}>
            {format(new Date(), 'EEEE, MMMM do')}
         </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* SCORE RING */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
           <div style={{ width: '120px', height: '120px', position: 'relative' }}>
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart 
                 cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" 
                 barSize={12} data={[{ name: 'Score', value: score, fill: 'var(--mauve)' }]} 
                 startAngle={90} endAngle={-270}
               >
                 <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                 <RadialBar minAngle={15} background={{ fill: 'var(--surface0)' }} clockWise dataKey="value" cornerRadius={6} />
               </RadialBarChart>
             </ResponsiveContainer>
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
             </div>
           </div>
           <div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Today's Score</h3>
             <p style={{ color: 'var(--subtext0)', fontSize: '0.9rem', marginTop: '4px' }}>Complete your tasks to reach 100.</p>
           </div>
        </div>

        {/* YESTERDAY MOOD SPARKLINE */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <div>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Mood</h3>
               <p style={{ color: 'var(--subtext0)', fontSize: '0.9rem' }}>Yesterday: {yesterdayMood ? [null,'😞','😕','😐','🙂','😄'][yesterdayMood] : 'No entry'}</p>
             </div>
           </div>
           <div style={{ height: '60px', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days}>
                   <YAxis domain={[1,5]} hide />
                   <Line type="monotone" dataKey="mood" stroke="var(--mauve)" strokeWidth={3} dot={{ fill: 'var(--mantle)', strokeWidth: 2, r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* MOMENTUM TODAY */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><Flame size={18} color="var(--teal)"/><h3 style={{ fontWeight: 800 }}>Momentum Today</h3></div>
          
          {momentumToday.length === 0 ? (
            <p style={{ color: 'var(--subtext0)', textAlign: 'center', padding: '24px 0' }}>No habits scheduled for today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {momentumToday.map(p => {
                const isLogged = p.stats.dailyScores[todayStr] !== undefined;
                return (
                  <div key={p.id} onClick={() => navigate('/momentum')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px', borderRadius: '8px', background: 'var(--base)', border: '1px solid var(--surface0)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</div>
                       <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--subtext0)' }}>🔥 {p.stats.currentStreak}</span>
                       {isLogged ? <CheckCircle size={18} color="var(--green)" /> : <Circle size={18} color="var(--yellow)" />}
                    </div>
                  </div>
                )
              })}
              {allMomentumDone && (
                <div style={{ padding: '12px', background: 'rgba(166, 227, 161, 0.1)', color: 'var(--green)', borderRadius: '8px', textAlign: 'center', fontWeight: 800, marginTop: '8px' }}>
                  All habits done today 🎉
                </div>
              )}
            </div>
          )}
        </div>

        {/* TODAY'S EVENTS */}
        <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><CalendarDays size={18} color="var(--blue)"/><h3 style={{ fontWeight: 800 }}>Today's Events</h3></div>
          
          {todaysEvents.length === 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0', opacity: 0.5 }}>
                 <CalendarDays size={32} />
                 <p style={{ color: 'var(--subtext0)' }}>No events today.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {todaysEvents.map(e => (
                 <div key={e._id} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--subtext0)', width: '60px', flexShrink: 0 }}>
                      {e.timestamp ? format(new Date(e.timestamp), 'h:mm a') : 'All day'}
                    </div>
                    <div style={{ width: '2px', background: 'var(--surface1)', position: 'relative' }}>
                       <div style={{ position: 'absolute', top: '4px', left: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--blue)' }} />
                    </div>
                    <div style={{ paddingBottom: '16px' }}>
                       <div style={{ fontWeight: 700 }}>{e.title}</div>
                       {e.tags && e.tags.length > 0 && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)', marginTop: '4px' }}>
                            {e.tags.join(', ')}
                          </div>
                       )}
                    </div>
                 </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE GOALS & WORKOUT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18} color="var(--red)"/><h3 style={{ fontWeight: 800 }}>Active Goals</h3></div>
              <Link to="/goals" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>View All</Link>
            </div>
            {activeGoals.length === 0 ? (
               <p style={{ color: 'var(--subtext0)', textAlign: 'center', padding: '16px 0' }}>No active goals.</p>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {activeGoals.slice(0, 3).map(g => (
                    <div key={g._id} style={{ padding: '12px', background: 'var(--base)', borderRadius: '8px', border: '1px solid var(--surface0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{g.title}</div>
                         {g.targetDate && <div style={{ fontSize: '0.75rem', color: 'var(--subtext0)' }}>Due: {format(new Date(g.targetDate), 'MMM d, yyyy')}</div>}
                       </div>
                       <span style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(166, 227, 161, 0.1)', color: 'var(--green)', borderRadius: '4px' }}>Active</span>
                    </div>
                 ))}
               </div>
            )}
          </div>

          <div style={{ background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={18} color="var(--mauve)"/><h3 style={{ fontWeight: 800 }}>Workout Today</h3></div>
              <Link to="/workout" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Open</Link>
            </div>
            <div style={{ padding: '16px', background: 'var(--base)', borderRadius: '8px', border: '1px solid var(--surface0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                 <div style={{ fontWeight: 700, color: workoutTodayStr === 'Rest Day' || !workoutLogged ? 'var(--subtext0)' : 'var(--text)' }}>{workoutTodayStr}</div>
                 {exCount > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--subtext0)' }}>Intensity Level: {exCount}</div>}
               </div>
               {workoutTodayStr !== 'Rest Day' && (
                  <div style={{ background: workoutLogged ? 'rgba(166, 227, 161, 0.1)' : 'var(--surface1)', color: workoutLogged ? 'var(--green)' : 'var(--text)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {workoutLogged ? 'Logged' : 'Pending'}
                  </div>
               )}
            </div>
          </div>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '64px' }}>
         <p style={{ fontStyle: 'italic', color: 'var(--subtext0)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
           "{quote}"
         </p>
      </div>

    </div>
  );
}
