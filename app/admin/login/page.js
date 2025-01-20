'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../context/AdminAuthContext';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginAdmin } = useAdminAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password.trim()) {
            setError('Enter username and password');
            return;
        }

        // Prototype: simple plaintext comparison against 'theater_admins' rows.
        // WARNING: This is not production-secure. Replace with bcrypt (or Supabase Auth) before real use.
        const { data, error: supaError } = await supabase
            .from('theater_admins')
            .select('id, theater_id, username, password')
            .eq('username', username.trim())
            .single();

        if (supaError || !data || data.password !== password) {
            setError('Invalid username or password');
            return;
        }

        const session = {
            theaterAdminId: data.id,
            theaterId: data.theater_id,
            username: data.username,
        };
        loginAdmin(session);
        router.push('/admin/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="w-full max-w-md animate-fade-in">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent mb-2">
                            Theater Admin
                        </h1>
                        <p className="text-gray-600">Log in to manage shows</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-2 border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm animate-slide-up">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                                Theater Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="input-field"
                                placeholder="admin"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                                placeholder="••••••"
                            />
                        </div>

                        <button type="submit" className="btn-primary w-full">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}