import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../api/axios';
import { format } from 'date-fns';
import { X, Save, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';

const MOODS = [
  { val: 1, emoji: '😞' },
  { val: 2, emoji: '😕' },
  { val: 3, emoji: '😐' },
  { val: 4, emoji: '🙂' },
  { val: 5, emoji: '😄' },
];

export default function JournalEditor({ date, existingEntry, onSaved }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoContextStr, setAutoContextStr] = useState('');
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setBody(existingEntry.body || '');
      setMood(existingEntry.mood || 3);
      setTags(existingEntry.tags || []);
    } else {
      setTitle('');
      setBody('');
      setMood(3);
      setTags([]);
    }

    // Parse momentum_data
    try {
      const local = localStorage.getItem('momentum_data');
      if (local) {
        const data = JSON.parse(local);
        const { programs = [], logs = [] } = data;
        
        let contextParts = [];
        const logsForDate = logs.filter(l => l.date === date);
        const loggedCount = logsForDate.length;
        
        let bestStreak = 0;
        let activeProgramCount = programs.filter(p => p.activeDays.includes(new Date(date).getDay())).length;

        programs.forEach(p => {
            let streak = 0;
            // quick calc
            if (p.id) streak = 1; // dummy placeholder for real streak logic from momentum
            if (streak > bestStreak) bestStreak = streak;
        });

        if (loggedCount > 0) contextParts.push(`🔥 Habits: ${loggedCount}/${activeProgramCount}`);
        else contextParts.push(`No habits logged.`);
        
        setAutoContextStr(contextParts.join(' • '));
      }
    } catch (e) { console.error('auto context err', e); }
  }, [date, existingEntry]);

  const handleSave = async (isAuto = false) => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const payload = { date, title, body, mood, tags, autoContext: { momentumSummary: autoContextStr } };
      if (existingEntry) {
        await axiosInstance.put(`/journal/${date}`, payload);
      } else {
        await axiosInstance.post('/journal', payload);
      }
      if (!isAuto) toast.success('Saved');
      onSaved();
    } catch (err) {
      if (!isAuto) toast.error('Failed to save entry');
    }
    setSaving(false);
  };

  const handleTextChange = (e, field) => {
    if (field === 'title') setTitle(e.target.value);
    if (field === 'body') setBody(e.target.value);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleSave(true);
    }, 2000);
  };

  const handleTagKey = (e) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < 5) {
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
      const saveTimer = setTimeout(() => handleSave(true), 100);
      return () => clearTimeout(saveTimer);
    }
  };

  const d = new Date(date);
  const formattedDate = format(new Date(d.getTime() + d.getTimezoneOffset() * 60000), 'EEEE, MMMM d, yyyy');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
         <div>
           <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formattedDate}</h2>
           {autoContextStr && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--subtext0)', marginTop: '8px', background: 'var(--surface0)', padding: '6px 12px', borderRadius: '8px', width: 'max-content' }}>
               <BrainCircuit size={14} color="var(--mauve)" /> {autoContextStr}
             </div>
           )}
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saving && <span style={{ fontSize: '0.8rem', color: 'var(--subtext0)', fontWeight: 600 }}>Saving...</span>}
            <button className="btn btn-primary" onClick={() => handleSave(false)}><Save size={16} /> Save</button>
         </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
         {MOODS.map(m => (
            <button 
              key={m.val} onClick={() => { setMood(m.val); setTimeout(()=>handleSave(true), 100); }}
              style={{ padding: '12px', fontSize: '1.5rem', borderRadius: '12px', background: mood === m.val ? 'var(--surface1)' : 'transparent', border: `2px solid ${mood === m.val ? 'var(--mauve)' : 'transparent'}`, transition: 'all 0.2s', cursor: 'pointer' }}
            >
               {m.emoji}
            </button>
         ))}
      </div>

      <input 
        type="text" 
        placeholder="Give this day a title..." 
        value={title} 
        onChange={e => handleTextChange(e, 'title')}
        style={{ width: '100%', fontSize: '1.5rem', fontWeight: 800, background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', marginBottom: '16px' }}
      />

      <textarea 
        placeholder="What happened today? How do you feel?..."
        value={body}
        onChange={e => handleTextChange(e, 'body')}
        style={{ width: '100%', flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: '1.05rem', lineHeight: 1.6, resize: 'none' }}
      />

      <div style={{ borderTop: '1px solid var(--surface0)', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
         {tags.map(t => (
           <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface1)', color: 'var(--text)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
              #{t}
              <X size={14} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => { setTags(tags.filter(xt => xt !== t)); setTimeout(()=>handleSave(true), 100); }} />
           </span>
         ))}
         {tags.length < 5 && (
            <input 
              type="text" placeholder="Add tag + Enter..." value={tagInput}
              onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKey}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.8rem', minWidth: '120px' }}
            />
         )}
      </div>
    </div>
  );
}
