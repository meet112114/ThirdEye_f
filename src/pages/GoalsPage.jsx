import { useState, useEffect } from 'react';
import { Plus, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import GoalCard from '../components/GoalCard';
import GoalModal from '../components/GoalModal';

export default function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/goals');
            setGoals(res.data.goals || []);
        } catch { toast.error('Could not load goals'); }
        finally { setLoading(false); }
    };

    const openAdd = () => { setEditingGoal(null); setModalOpen(true); };
    const openEdit = (g) => { setEditingGoal(g); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingGoal(null); };

    const handleSave = async (data) => {
        try {
            if (editingGoal) {
                const res = await api.put(`/goals/${editingGoal._id}`, data);
                setGoals(prev => prev.map(g => g._id === editingGoal._id ? res.data.goal : g));
                toast.success('Goal updated');
            } else {
                const res = await api.post('/goals', data);
                setGoals(prev => [res.data.goal, ...prev]);
                toast.success('Goal added!');
            }
            closeModal();
        } catch (err) { throw err; }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/goals/${id}`);
            setGoals(prev => prev.filter(g => g._id !== id));
            toast.success('Goal deleted');
        } catch { toast.error('Could not delete goal'); throw new Error(); }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const res = await api.patch(`/goals/${id}/status`, { status });
            setGoals(prev => prev.map(g => g._id === id ? res.data.goal : g));
            toast.success(`Goal marked as ${status}`);
        } catch { toast.error('Could not update status'); throw new Error(); }
    };

    const handleTasksChange = async (id, tasks) => {
        try {
            const res = await api.patch(`/goals/${id}/tasks`, { tasks });
            setGoals(prev => prev.map(g => g._id === id ? res.data.goal : g));
        } catch { toast.error('Could not update task'); throw new Error(); }
    };

    // Partition goals
    const active = goals.filter(g => g.status === 'active');
    const archived = goals.filter(g => g.status !== 'active');
    const activeLT = active.filter(g => g.type === 'long_term');
    const activeST = active.filter(g => g.type === 'short_term');

    return (
        <div className="page-section">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Goals</h2>
                    <p className="page-subtitle">Track your long and short-term objectives</p>
                </div>
                <button id="btn-add-goal" className="btn btn-primary" onClick={openAdd}
                    style={{ width: 'auto', padding: '10px 20px' }}>
                    <Plus size={16} /> Add Goal
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
            ) : goals.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 60 }}>
                    <div className="empty-state-icon">
                        <Target size={28} color="var(--overlay0)" />
                    </div>
                    <h3>No goals yet</h3>
                    <p>Add your first goal to start tracking your progress</p>
                </div>
            ) : (
                <>
                    {/* Long-term active goals */}
                    {activeLT.length > 0 && (
                        <section className="goals-section">
                            <h3 className="goals-section-title">
                                <span className="section-dot dot-blue" /> Long-term Goals
                                <span className="section-count">{activeLT.length}</span>
                            </h3>
                            <div className="goals-grid">
                                {activeLT.map(g => (
                                    <GoalCard key={g._id} goal={g} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onTasksChange={handleTasksChange} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Short-term active goals */}
                    {activeST.length > 0 && (
                        <section className="goals-section">
                            <h3 className="goals-section-title">
                                <span className="section-dot dot-mauve" /> Short-term Goals
                                <span className="section-count">{activeST.length}</span>
                            </h3>
                            <div className="goals-grid">
                                {activeST.map(g => (
                                    <GoalCard key={g._id} goal={g} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onTasksChange={handleTasksChange} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Archived */}
                    {archived.length > 0 && (
                        <section className="goals-section goals-section-archived">
                            <h3 className="goals-section-title">
                                <span className="section-dot dot-surface" /> Archived
                                <span className="section-count">{archived.length}</span>
                            </h3>
                            <div className="goals-grid">
                                {archived.map(g => (
                                    <GoalCard key={g._id} goal={g} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onTasksChange={handleTasksChange} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            {modalOpen && (
                <GoalModal goal={editingGoal} onSave={handleSave} onClose={closeModal} />
            )}
        </div>
    );
}
