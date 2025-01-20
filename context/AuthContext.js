'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            const email = localStorage.getItem('currentUserEmail');
            if (email) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();
                if (data && !error) {
                    setUser(data);
                } else {
                    // Stale session — clear it
                    localStorage.removeItem('currentUserEmail');
                }
            }
            setLoading(false);
        };
        initUser();
    }, []);

    const login = async (email) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (data && !error) {
            setUser(data);
            localStorage.setItem('currentUserEmail', email);
            return { success: true };
        }
        return { success: false, error: 'Email not found. Please sign up.' };
    };

    const signup = async (name, email, _otpIgnored, extra = {}) => {
        const { data, error } = await supabase
            .from('users')
            .insert({
                name,
                email,
                age: extra.age || null,
                mobile: extra.mobile || null,
                district_id: extra.districtId || null,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation on email
                return { success: false, error: 'This email is already registered' };
            }
            console.error('Signup error:', error);
            return { success: false, error: 'Something went wrong. Please try again.' };
        }

        setUser(data);
        localStorage.setItem('currentUserEmail', data.email);
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUserEmail');
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