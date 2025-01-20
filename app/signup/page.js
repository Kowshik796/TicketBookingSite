'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { districts } from '../../data/mock';

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [expectedOtp, setExpectedOtp] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [error, setError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const isValidMobile = !mobile || (mobile.length === 10 && /^\d+$/.test(mobile));
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isStep1Valid = name.trim() && Number(age) >= 13 && email.trim() && isValidEmail && isValidMobile;

    const handleSendOtp = async () => {
        if (!isStep1Valid) return;
        setError('');
        setSendingOtp(true);
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to send OTP');
                return;
            }
            setExpectedOtp(data.otp);
            setResendCooldown(30);
            setStep(2);
        } catch {
            setError('Failed to send OTP. Please check your email and try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const handleVerifyOtp = () => {
        const entered = otp.join('');
        if (entered.length !== 6) {
            setError('Please enter the full 6-digit OTP');
            return;
        }
        if (entered !== expectedOtp) {
            setError('Invalid OTP. Please try again.');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleCompleteSignup = async () => {
        if (!districtId) {
            setError('Please select a district');
            return;
        }
        const result = await signup(name, email, expectedOtp, {
            age: Number(age),
            mobile: mobile || '',
            gmail: email,
            districtId: Number(districtId),
        });
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="w-full max-w-md animate-fade-in">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent mb-2">
                            Watch Your Show
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {step === 1 && 'Create your account'}
                            {step === 2 && 'Verify your email'}
                            {step === 3 && 'Select your district'}
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s
                                        ? 'bg-gradient-to-r from-[#C21807] to-[#E63946] text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div
                                        className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-gradient-to-r from-[#C21807] to-[#E63946]' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm animate-slide-up mb-6">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Details */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="input-field"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="age" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Age
                                </label>
                                <input
                                    id="age"
                                    type="number"
                                    min="13"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    required
                                    className="input-field"
                                    placeholder="18"
                                />
                                {age && Number(age) < 13 && (
                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">You must be at least 13 years old.</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Mobile Number <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                                </label>
                                <input
                                    id="mobile"
                                    type="tel"
                                    maxLength={10}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="input-field"
                                    placeholder="9876543210"
                                />
                                {mobile && !isValidMobile && (
                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">Enter a valid 10-digit mobile number.</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input-field"
                                    placeholder="you@gmail.com"
                                />
                                {email && !isValidEmail && (
                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">Enter a valid email address.</p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={!isStep1Valid || sendingOtp}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingOtp ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                OTP sent to {email}
                            </p>

                            <div className="flex justify-center gap-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={otpRefs[index]}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#C21807] focus:ring-2 focus:ring-red-200 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={otp.join('').length !== 6}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify OTP
                            </button>

                            <div className="text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Resend OTP in {resendCooldown}s</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        className="text-sm text-[#C21807] font-semibold hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: District Selection */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="district" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Select District
                                </label>
                                <select
                                    id="district"
                                    value={districtId}
                                    onChange={(e) => setDistrictId(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">-- Choose a district --</option>
                                    {districts.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleCompleteSignup}
                                disabled={!districtId}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Complete Signup
                            </button>
                        </div>
                    )}

                    <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-gradient font-bold hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}