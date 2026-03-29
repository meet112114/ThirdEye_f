import { NavLink } from 'react-router-dom';
import { Eye, LogOut, CalendarDays, Target, Dumbbell, Flame, Sun, NotebookPen, BarChart3, Moon, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored ? stored === 'dark' : true; // default dark
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const stored = localStorage.getItem('sidebarState');
        return stored ? stored === 'expanded' : false; // default collapsed
    });

    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [isDark]);

    useEffect(() => {
        localStorage.setItem('sidebarState', isSidebarOpen ? 'expanded' : 'collapsed');
    }, [isSidebarOpen]);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    return (
        <div className="app-shell" style={{ '--sidebar-w': isSidebarOpen ? '224px' : '64px' }}>
            {/* Topbar */}
            <header className="topbar">
                <div className="topbar-brand">
                    <button className="btn-icon sidebar-toggle-mobile" onClick={toggleSidebar}>
                        <Menu size={20} />
                    </button>
                    <div className="topbar-eye">
                        <Eye size={16} strokeWidth={2.5} color="var(--crust, #11111b)" />
                    </div>
                    <h1>Third Eye</h1>
                </div>
                <div className="topbar-right">
                    {/* Theme Toggle */}
                    <button
                        className="theme-toggle"
                        onClick={() => setIsDark(d => !d)}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        <div className="theme-toggle-knob">
                            {isDark ? '🌙' : '☀️'}
                        </div>
                    </button>

                    <div className="user-chip">
                        <div className="user-chip-dot" />
                        <span>{user?.name || user?.email?.split('@')[0] || 'You'}</span>
                    </div>
                    <button
                        id="btn-logout"
                        className="btn btn-icon"
                        onClick={logout}
                        aria-label="Log out"
                        title="Log out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <div className="layout-body">
                {/* Mobile backdrop */}
                {isSidebarOpen && (
                    <div
                        className="sidebar-backdrop"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}
                {/* Main navigation tabs */}
                <nav className={`main-sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`} aria-label="Main navigation">
                    <div className="sidebar-toggle-wrap">
                        <button className="btn-icon sidebar-toggle-desktop" onClick={toggleSidebar} aria-label="Toggle sidebar">
                            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>
                    <div className="sidebar-links">
                        <NavLink to="/today" data-label="Today" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-today">
                            <Sun size={20} />
                            <span className="nav-label">Today</span>
                        </NavLink>
                        <NavLink to="/" end data-label="Dashboard" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-events">
                            <CalendarDays size={20} />
                            <span className="nav-label">Dashboard</span>
                        </NavLink>
                        <NavLink to="/journal" data-label="Journal" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-journal">
                            <NotebookPen size={20} />
                            <span className="nav-label">Journal</span>
                        </NavLink>
                        <NavLink to="/goals" data-label="Goals" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-goals">
                            <Target size={20} />
                            <span className="nav-label">Goals</span>
                        </NavLink>
                        <NavLink to="/workout" data-label="Workout" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-workout">
                            <Dumbbell size={20} />
                            <span className="nav-label">Workout</span>
                        </NavLink>
                        <NavLink to="/momentum" data-label="Momentum" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-momentum">
                            <Flame size={20} />
                            <span className="nav-label">Momentum</span>
                        </NavLink>
                        <NavLink to="/weekly" data-label="Weekly" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-weekly">
                            <BarChart3 size={20} />
                            <span className="nav-label">Weekly</span>
                        </NavLink>
                        <NavLink to="/samurai" data-label="Samurai" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} id="nav-samurai">
                            <Sun size={20} />
                            <span className="nav-label">Samurai</span>
                        </NavLink>
                    </div>
                </nav>

                {/* Page content */}
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
