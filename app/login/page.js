'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const isValidMobile = mobile.length === 10 && /^\d+$/.test(mobile);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!isValidMobile) {
            setError('Enter a valid 10-digit mobile number');
            return;
        }
        const result = login(mobile);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="w-full max-w-md animate-fade-in">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent mb-2">
                            Watch Your Show
                        </h1>
                        <p className="text-gray-600">Log in to book movie tickets</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-2 border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm animate-slide-up">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                                Mobile Number
                            </label>
                            <input
                                id="mobile"
                                type="tel"
                                maxLength={10}
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                required
                                className="input-field"
                                placeholder="9876543210"
                            />
                        </div>

                        <button type="submit" className="btn-primary w-full">
                            Log In
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-gradient font-bold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
