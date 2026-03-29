import { useState, useEffect, useCallback } from 'react';
import { startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import { formatDate, getDateLabel, localDayBounds } from '../utils/dateUtils';

function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton-line short" style={{ height: 28, width: 52 }} />
                <div className="skeleton-line medium" />
            </div>
            <div className="skeleton-line long" style={{ height: 12 }} />
            <div className="skeleton-line" style={{ height: 12, width: 45 }} />
        </div>
    );
}

export default function DashboardPage() {
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const dateStr = formatDate(selectedDate);
    const dateLabel = getDateLabel(selectedDate);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = localDayBounds(dateStr);
            const res = await api.get(`/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            setEvents(res.data.events || []);
        } catch {
            toast.error('Could not load events');
        } finally {
            setLoading(false);
        }
    }, [dateStr]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const openAddModal = () => { setEditingEvent(null); setModalOpen(true); };
    const openEditModal = (ev) => { setEditingEvent(ev); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingEvent(null); };

    const handleSave = async (data) => {
        try {
            if (editingEvent) {
                const res = await api.put(`/events/${editingEvent._id}`, data);
                setEvents(prev => prev.map(e => e._id === editingEvent._id ? res.data.event : e)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                toast.success('Event updated');
            } else {
                const res = await api.post('/events', data);
                setEvents(prev => [...prev, res.data.event]
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                toast.success('Event logged!');
            }
            closeModal();
        } catch (err) { throw err; }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/events/${id}`);
            setEvents(prev => prev.filter(e => e._id !== id));
            toast.success('Event deleted');
            if (editingEvent?._id === id) closeModal();
        } catch {
            toast.error('Could not delete event');
            throw new Error();
        }
    };

    const subDaysLocal = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() - days);
        return d;
    };
    const addDaysLocal = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    };

    const goBack = () => setSelectedDate(d => subDaysLocal(d, 1));
    const goForward = () => {
        const next = addDaysLocal(selectedDate, 1);
        if (next <= startOfDay(new Date())) setSelectedDate(next);
    };
    const isToday = formatDate(selectedDate) === formatDate(startOfDay(new Date()));

    const handleDateInput = (e) => {
        const newDate = startOfDay(new Date(e.target.value + 'T00:00:00'));
        if (newDate <= startOfDay(new Date())) setSelectedDate(newDate);
    };

    return (
        <>
            {/* Day navigation */}
            <nav className="day-nav" aria-label="Day navigation">
                <button id="btn-prev-day" className="day-nav-btn" onClick={goBack} aria-label="Previous day">
                    <ChevronLeft size={18} />
                </button>

                <div className="day-label">
                    <div className="day-label-main">
                        {dateLabel.main}
                        {dateLabel.isToday && <span className="day-pill">Today</span>}
                    </div>
                    {!dateLabel.isToday && <div className="day-label-sub">{dateLabel.sub}</div>}
                </div>

                <button id="btn-next-day" className="day-nav-btn" onClick={goForward} disabled={isToday} aria-label="Next day">
                    <ChevronRight size={18} />
                </button>

                <div className="date-input-wrap" title="Jump to date">
                    <input
                        id="date-picker"
                        type="date"
                        value={dateStr}
                        max={formatDate(new Date())}
                        onChange={handleDateInput}
                        aria-label="Pick date"
                    />
                </div>
            </nav>

            {/* Main content */}
            <main className="main-content">
                <div className="add-event-bar">
                    <button id="btn-add-event" className="btn" onClick={openAddModal}>
                        <Plus size={18} />
                        Log an event…
                    </button>
                </div>

                <div className="event-list-header">
                    <span className="event-count-label">
                        {loading ? '—' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {loading ? (
                    <div className="event-list">
                        <SkeletonCard /><SkeletonCard /><SkeletonCard />
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <CalendarDays size={28} color="var(--overlay0)" />
                        </div>
                        <h3>No events logged</h3>
                        <p>
                            {dateLabel.isToday
                                ? "Start recording your day. Hit 'Log an event' above."
                                : 'Nothing was logged on this day.'}
                        </p>
                    </div>
                ) : (
                    <div className="event-list">
                        {events.map(event => (
                            <EventCard key={event._id} event={event} onEdit={openEditModal} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </main>

            {modalOpen && (
                <EventModal
                    selectedDate={dateStr}
                    event={editingEvent}
                    onSave={handleSave}
                    onClose={closeModal}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
}
