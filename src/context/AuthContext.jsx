import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('te_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('te_token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/auth/me')
            .then((res) => {
                setUser(res.data.user);
                localStorage.setItem('te_user', JSON.stringify(res.data.user));
            })
            .catch(() => {
                localStorage.removeItem('te_token');
                localStorage.removeItem('te_user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('te_token', res.data.token);
        localStorage.setItem('te_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const register = async (email, password, name) => {
        const res = await api.post('/auth/register', { email, password, name });
        localStorage.setItem('te_token', res.data.token);
        localStorage.setItem('te_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('te_token');
        localStorage.removeItem('te_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
