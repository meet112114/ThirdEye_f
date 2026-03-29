import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Email and password are required.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await register(form.email, form.password, form.name);
            toast.success('Account created! Welcome 👁️');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <Eye size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1>Third Eye</h1>
                        <span>Personal Event Logger</span>
                    </div>
                </div>

                <h2 className="auth-title">Create account</h2>
                <p className="auth-subtitle">Start logging your day</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reg-name">Name (optional)</label>
                        <input
                            id="reg-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Your name"
                            value={form.name}
                            onChange={handleChange}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reg-confirm">Confirm password</label>
                        <input
                            id="reg-confirm"
                            name="confirm"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            value={form.confirm}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        id="btn-register"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: 8 }}
                    >
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <div className="auth-link">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
