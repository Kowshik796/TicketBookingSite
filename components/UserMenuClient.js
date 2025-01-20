'use client';

import { useAuth } from '../context/AuthContext';

export default function UserMenuClient() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm">Hi, {user.name}</span>
            <button
                onClick={logout}
                className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
            >
                Logout
            </button>
        </div>
    );
}