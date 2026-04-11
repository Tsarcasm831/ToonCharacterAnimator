import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { signIn, signUp, signOut } from '../../../lib/auth';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onManualSave?: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, user, onManualSave }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);
        try {
            if (activeTab === 'login') {
                await signIn(email, password);
                onClose();
            } else {
                await signUp(email, password);
                setSuccessMsg('Account created! Check your email to confirm, then log in.');
                setActiveTab('login');
            }
        } catch (err: any) {
            setError(err?.message ?? 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signOut();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? 'Sign-out failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSave = async () => {
        if (!onManualSave) return;
        setError(null);
        setIsLoading(true);
        try {
            await onManualSave();
        } catch (err: any) {
            setError(err?.message ?? 'Save failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-slate-900/95 border-2 border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {user ? 'Profile' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
                    </h2>
                    <button type="button" onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {user ? (
                    /* Logged-in view */
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Logged in as</p>
                                <p className="text-white font-semibold text-sm truncate max-w-[280px]">{user.email}</p>
                            </div>
                        </div>

                        {onManualSave && (
                            <button
                                type="button"
                                onClick={handleManualSave}
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg font-bold uppercase tracking-widest hover:from-green-600 hover:to-green-500 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Saving…' : 'Save Game Now'}
                            </button>
                        )}

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 rounded-lg font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            {isLoading ? '…' : 'Sign Out'}
                        </button>
                    </div>
                ) : (
                    /* Auth form */
                    <>
                        <div className="flex border-b border-white/5">
                            <button type="button"
                                onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                                    activeTab === 'login'
                                        ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                            >Login</button>
                            <button type="button"
                                onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                                    activeTab === 'register'
                                        ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                            >Create Account</button>
                        </div>

                        <div className="p-8 space-y-5">
                            {error && (
                                <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3 text-green-300 text-sm">
                                    {successMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        placeholder="••••••••"
                                        required
                                        autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? 'Please wait…' : activeTab === 'login' ? 'Sign In' : 'Register'}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
