'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    // Basic info state
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');

    // Change email state
    const [emailStep, setEmailStep] = useState(0); // 0 = not started, 1 = verify old email, 2 = enter new email, 3 = verify new email
    const [oldEmailOtp, setOldEmailOtp] = useState(['', '', '', '', '', '']);
    const [newEmail, setNewEmail] = useState('');
    const [newEmailOtp, setNewEmailOtp] = useState(['', '', '', '', '', '']);
    const [expectedOldOtp, setExpectedOldOtp] = useState('');
    const [expectedNewOtp, setExpectedNewOtp] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [emailSuccess, setEmailSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const oldOtpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    const newOtpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setMobile(user.mobile || '');
        }
    }, [user]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    // --- Save basic info ---
    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setSavedMessage('');
        try {
            const { error } = await supabase
                .from('users')
                .update({ name: name.trim(), mobile: mobile || null })
                .eq('email', user.email);

            if (error) {
                console.error('Save error:', error);
                return;
            }
            updateUser({ name: name.trim(), mobile: mobile || null });
            setSavedMessage('Saved!');
            setTimeout(() => setSavedMessage(''), 3000);
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    // --- OTP helpers ---
    const handleOtpChange = (otp, setter, refs, index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setter(newOtp);
        if (value && index < 5) {
            refs[index + 1].current?.focus();
        }
    };

    const handleOtpKeyDown = (otp, index, e, refs) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            refs[index - 1].current?.focus();
        }
    };

    // --- Step A: Send OTP to old email ---
    const handleStartEmailChange = async () => {
        setEmailError('');
        setSendingOtp(true);
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setEmailError(data.error || 'Failed to send OTP');
                return;
            }
            setExpectedOldOtp(data.otp);
            setResendCooldown(30);
            setEmailStep(1);
        } catch {
            setEmailError('Failed to send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    // --- Step B: Verify OTP for old email ---
    const handleVerifyOldEmailOtp = () => {
        const entered = oldEmailOtp.join('');
        if (entered.length !== 6) {
            setEmailError('Please enter the full 6-digit OTP');
            return;
        }
        if (entered !== expectedOldOtp) {
            setEmailError('Invalid OTP. Please try again.');
            return;
        }
        setEmailError('');
        setEmailStep(2);
    };

    // --- Step C: Send OTP to new email ---
    const handleSendNewEmailOtp = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }
        if (newEmail.toLowerCase() === user.email.toLowerCase()) {
            setEmailError('New email must be different from your current email.');
            return;
        }

        // Check if email already taken
        setEmailError('');
        setSendingOtp(true);
        try {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', newEmail)
                .single();

            if (existing) {
                setEmailError('This email is already registered to another account.');
                setSendingOtp(false);
                return;
            }

            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setEmailError(data.error || 'Failed to send OTP');
                return;
            }
            setExpectedNewOtp(data.otp);
            setResendCooldown(30);
            setEmailStep(3);
        } catch {
            setEmailError('Failed to send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    // --- Step D: Verify OTP for new email and update ---
    const handleVerifyNewEmailOtp = async () => {
        const entered = newEmailOtp.join('');
        if (entered.length !== 6) {
            setEmailError('Please enter the full 6-digit OTP');
            return;
        }
        if (entered !== expectedNewOtp) {
            setEmailError('Invalid OTP. Please try again.');
            return;
        }

        setEmailError('');
        setSendingOtp(true);
        try {
            const oldEmail = user.email;
            const { error } = await supabase
                .from('users')
                .update({ email: newEmail })
                .eq('email', oldEmail);

            if (error) {
                setEmailError('Failed to update email. Please try again.');
                setSendingOtp(false);
                return;
            }

            localStorage.setItem('currentUserEmail', newEmail);
            updateUser({ email: newEmail });
            setEmailSuccess(`Your email has been updated to ${newEmail}`);
            setEmailStep(0);
            setOldEmailOtp(['', '', '', '', '', '']);
            setNewEmailOtp(['', '', '', '', '', '']);
            setNewEmail('');
            setExpectedOldOtp('');
            setExpectedNewOtp('');
            setTimeout(() => setEmailSuccess(''), 5000);
        } catch {
            setEmailError('Failed to update email. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-md mx-auto animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent mb-2">
                        Your Info
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your personal details
                    </p>
                </div>

                {/* Basic Info Card */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">Personal Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                maxLength={10}
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="input-field"
                                placeholder="9876543210"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!name.trim() || saving}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        {savedMessage && (
                            <p className="text-center text-sm text-green-600 dark:text-green-400 font-semibold animate-slide-up">
                                {savedMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Change Email Card */}
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">Change Email</h2>

                    {emailSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-100 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm animate-slide-up mb-6">
                            {emailSuccess}
                        </div>
                    )}

                    {emailError && (
                        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm animate-slide-up mb-6">
                            {emailError}
                        </div>
                    )}

                    {emailStep === 0 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Current Email
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    readOnly
                                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleStartEmailChange}
                                disabled={sendingOtp}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingOtp ? 'Sending...' : 'Change Email'}
                            </button>
                        </div>
                    )}

                    {emailStep === 1 && (
                        <div className="space-y-6">
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                We sent a verification code to your current email ({user.email}). Enter it to continue.
                            </p>

                            <div className="flex justify-center gap-3">
                                {oldEmailOtp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={oldOtpRefs[index]}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(oldEmailOtp, setOldEmailOtp, oldOtpRefs, index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(oldEmailOtp, index, e, oldOtpRefs)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#C21807] focus:ring-2 focus:ring-red-200 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyOldEmailOtp}
                                disabled={oldEmailOtp.join('').length !== 6}
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
                                        onClick={handleStartEmailChange}
                                        className="text-sm text-[#C21807] font-semibold hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {emailStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center mb-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C21807] to-[#E63946] text-white flex items-center justify-center text-xs font-bold">1</span>
                                    <span className="w-8 h-0.5 bg-gradient-to-r from-[#C21807] to-[#E63946] rounded" />
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C21807] to-[#E63946] text-white flex items-center justify-center text-xs font-bold">2</span>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">Step 1 of 2 — Old email verified</p>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    New Email Address
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="newemail@example.com"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSendNewEmailOtp}
                                disabled={!newEmail || sendingOtp}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingOtp ? 'Sending...' : 'Send Verification Code'}
                            </button>
                        </div>
                    )}

                    {emailStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center mb-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C21807] to-[#E63946] text-white flex items-center justify-center text-xs font-bold">1</span>
                                    <span className="w-8 h-0.5 bg-gradient-to-r from-[#C21807] to-[#E63946] rounded" />
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C21807] to-[#E63946] text-white flex items-center justify-center text-xs font-bold">2</span>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">Step 2 of 2 — We sent a verification code to {newEmail}. Enter it to confirm the change.</p>

                            <div className="flex justify-center gap-3">
                                {newEmailOtp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={newOtpRefs[index]}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(newEmailOtp, setNewEmailOtp, newOtpRefs, index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(newEmailOtp, index, e, newOtpRefs)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#C21807] focus:ring-2 focus:ring-red-200 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyNewEmailOtp}
                                disabled={newEmailOtp.join('').length !== 6 || sendingOtp}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingOtp ? 'Updating...' : 'Confirm Change'}
                            </button>

                            <div className="text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Resend OTP in {resendCooldown}s</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendNewEmailOtp}
                                        className="text-sm text-[#C21807] font-semibold hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}