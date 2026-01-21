import React, { useState } from 'react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', activeTab, formData);
        // TODO: Implement actual login/register logic
        onClose();
    };

    const handleGoogleLogin = () => {
        console.log('Google login clicked');
        // TODO: Implement Google login logic
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-slate-900/95 border-2 border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {activeTab === 'login' ? 'Access Terminal' : 'New Identity'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                            activeTab === 'login' 
                                ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                            activeTab === 'register' 
                                ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        Create Account
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 px-4 bg-white text-slate-900 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                            <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                            <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                            <path fill="#FBBC05" d="M5.277 14.268A7.11 7.11 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.938 11.938 0 0 0 0 12c0 1.92.445 3.719 1.237 5.273l4.04-3.005Z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 bg-slate-900 text-slate-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        {activeTab === 'register' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {activeTab === 'login' ? 'Initialize' : 'Register'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
