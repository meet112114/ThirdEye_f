import React from 'react';
import { format } from 'date-fns';

const MOODS = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export default function JournalCard({ entry, isSelected, onClick }) {
  const d = new Date(entry.date);
  const formattedDate = format(new Date(d.getTime() + d.getTimezoneOffset() * 60000), 'E, d MMM'); // Fix timezone offset for YYYY-MM-DD
  
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '16px',
        background: 'var(--mantle)',
        border: `1px solid ${isSelected ? 'var(--mauve)' : 'var(--surface0)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 0 0 1px var(--mauve)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
          {formattedDate}
        </h4>
        <span style={{ fontSize: '1.2rem' }}>{MOODS[entry.mood]}</span>
      </div>
      
      {entry.title && (
         <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>{entry.title}</div>
      )}
      <p style={{ fontSize: '0.85rem', color: 'var(--subtext0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {(entry.body || '').slice(0, 60)}{(entry.body || '').length > 60 ? '...' : ''}
      </p>

      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
          {entry.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--surface1)', borderRadius: '4px', color: 'var(--text)', fontWeight: 600 }}>
              #{t}
            </span>
          ))}
          {entry.tags.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--subtext0)' }}>+{entry.tags.length - 3}</span>}
        </div>
      )}
    </div>
  );
}
