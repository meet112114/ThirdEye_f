import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import WorkoutPage from './pages/WorkoutPage';
import MomentumPage from './pages/momentum/MomentumPage';
import TodayPage from './pages/today/TodayPage';
import JournalPage from './pages/journal/JournalPage';
import WeeklyPage from './pages/weekly/WeeklyPage';
import SamuraiPage from './pages/SamuraiPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="splash-loader">
        <div className="splash-eye">
          <div className="splash-pupil" />
        </div>
        <p>Third Eye</p>
      </div>
    );
  }
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/today" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #313244',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/today" element={<PrivateRoute><TodayPage /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/journal" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
          <Route path="/workout" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
          <Route path="/momentum" element={<PrivateRoute><MomentumPage /></PrivateRoute>} />
          <Route path="/weekly" element={<PrivateRoute><WeeklyPage /></PrivateRoute>} />
          <Route path="/samurai" element={<PrivateRoute><SamuraiPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
