'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (mobile) => {
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        const found = users.find(u => u.mobile === mobile);
        if (found) {
            const { password, ...userWithoutPassword } = found;
            setUser(userWithoutPassword);
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            return { success: true };
        }
        return { success: false, error: 'Mobile number not found' };
    };

    const signup = (name, email, password, extra = {}) => {
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        if (users.find(u => u.email === email || u.mobile === extra.mobile)) {
            return { success: false, error: 'Email or mobile already registered' };
        }
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            age: extra.age || null,
            mobile: extra.mobile || '',
            gmail: extra.gmail || '',
            districtId: extra.districtId || null,
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}