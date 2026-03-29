import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { format } from 'date-fns';
import JournalEditor from './components/JournalEditor';
import JournalCard from './components/JournalCard';
import { NotebookPen, Plus } from 'lucide-react';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      const res = await axiosInstance.get('/journal');
      setEntries(res.data);
      if (res.data.length === 0 || !res.data.find(e => e.date === format(new Date(), 'yyyy-MM-dd'))) {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      } else if (res.data.length > 0 && !selectedDate) {
        setSelectedDate(res.data[0].date);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching journal', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleCreateNew = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const selectedEntry = entries.find(e => e.date === selectedDate);

  if (loading) return <div className="page-section"><div className="loading-spinner-wrap"><div className="spinner"></div></div></div>;

  return (
    <div className="page-section journal-page-wrap" style={{ height: 'calc(100vh - 100px)', paddingBottom: '0', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div>
          <h1 className="page-title"><NotebookPen size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }}/> Journal</h1>
          <p className="page-subtitle">Track your thoughts and moods.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
           <Plus size={18} /> New Entry
        </button>
      </div>

      <div className="journal-layout" style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        <div className="journal-sidebar" style={{ width: '300px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
          {entries.length === 0 ? (
             <p style={{ color: 'var(--subtext0)', textAlign: 'center', marginTop: '40px' }}>No entries found.</p>
          ) : (
            entries.map(e => (
              <JournalCard
                key={e._id}
                entry={e}
                isSelected={selectedDate === e.date}
                onClick={() => setSelectedDate(e.date)}
              />
            ))
          )}
        </div>
        
        <div className="journal-editor-panel" style={{ flex: 1, background: 'var(--mantle)', border: '1px solid var(--surface0)', borderRadius: 'var(--radius-xl)', padding: '24px', overflowY: 'auto' }}>
           {selectedDate ? (
             <JournalEditor 
               date={selectedDate} 
               existingEntry={selectedEntry} 
               onSaved={fetchEntries} 
             />
           ) : (
             <p style={{ color: 'var(--subtext0)', textAlign: 'center', marginTop: '40px' }}>Select or create an entry.</p>
           )}
        </div>
      </div>
    </div>
  );
}
