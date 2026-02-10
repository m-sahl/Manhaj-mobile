import { useState, useEffect } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Database, ShieldAlert, ArrowLeft, KeyRound, CloudUpload, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { X } from 'lucide-react';

export default function Settings() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [stats, setStats] = useState({ members: 0, payments: 0 });

    // Password Prompt State
    const [promptState, setPromptState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onSuccess: null
    });
    const [promptPassword, setPromptPassword] = useState('');
    const [promptError, setPromptError] = useState('');
    const [showPromptPassword, setShowPromptPassword] = useState(false);

    const openPrompt = (title, message, onSuccess) => {
        setPromptState({ isOpen: true, title, message, onSuccess });
        setPromptPassword('');
        setPromptError('');
        setShowPromptPassword(false);
    };

    const closePrompt = () => {
        setPromptState({ ...promptState, isOpen: false });
        setPromptPassword('');
        setPromptError('');
    };

    const verifyMutation = useMutation(api.auth.verify);

    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        setPromptError('');
        const result = await verifyMutation({ password: promptPassword });
        if (result.success) {
            promptState.onSuccess();
            closePrompt();
        } else {
            setPromptError('Incorrect admin password');
            setPromptPassword('');
        }
    };

    const cloudMembers = useQuery(api.members.list) || [];
    const cloudPayments = useQuery(api.payments.list) || [];

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const updatePasswordMutation = useMutation(api.auth.updatePassword);

    const handleChangePassword = async () => {
        if (passData.new.length < 4) {
            alert('New password must be at least 4 characters');
            return;
        }
        if (passData.new !== passData.confirm) {
            alert('New passwords do not match');
            return;
        }

        try {
            const result = await updatePasswordMutation({
                currentPassword: passData.current,
                newPassword: passData.new
            });

            if (result.success) {
                alert('Password updated successfully');
                setIsChangingPassword(false);
                setPassData({ current: '', new: '', confirm: '' });
            } else {
                alert('Failed to update password: ' + result.message);
            }
        } catch (err) {
            alert('Connection error. Please try again.');
        }
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleCloudBackup = async () => {
        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            members: cloudMembers,
            payments: cloudPayments
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Manhaj_Cloud_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLogout = () => {
        openPrompt(
            "Confirm Logout",
            "Please enter your admin password to sign out.",
            () => {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        );
    };

    const [migrating, setMigrating] = useState(false);

    const handleReset = () => {
        openPrompt(
            "Factory Reset Function",
            "This action is irreversible. All data will be permanently deleted.",
            async () => {
                alert('Resetting Cloud database is not enabled from here for safety. Contact Admin.');
            }
        );
    };

    return (
        <div className="animate-fade-in space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
            </div>

            {/* Account Section - Logout & Security */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50 mb-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Admin Account</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Current Session Active</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl active:scale-95 transition-all text-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                        Log Out
                    </button>
                </div>

                {/* Change Password Panel */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm mb-4"
                    >
                        <KeyRound size={16} />
                        <span>{isChangingPassword ? 'Cancel Password Change' : 'Change Admin Password'}</span>
                    </button>

                    {isChangingPassword && (
                        <form className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-3 animate-fade-in border border-slate-200 dark:border-slate-700" autoComplete="off">
                            <div className="relative">
                                <input
                                    type={showChangePassword ? "text" : "password"}
                                    placeholder="Current Password"
                                    autoComplete="new-password"
                                    value={passData.current}
                                    onChange={e => setPassData({ ...passData, current: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowChangePassword(!showChangePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showChangePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <input
                                type={showChangePassword ? "text" : "password"}
                                placeholder="New Password"
                                autoComplete="new-password"
                                value={passData.new}
                                onChange={e => setPassData({ ...passData, new: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <input
                                type={showChangePassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                autoComplete="new-password"
                                value={passData.confirm}
                                onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <button
                                type="button"
                                onClick={handleChangePassword}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
                            >
                                Update Password
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Theme Section */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                            {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Appearance</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between Light and Dark mode</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl active:scale-95 transition-all text-sm"
                    >
                        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    </button>
                </div>
            </section>

            {/* Data Management Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 ml-2">Data Management</h3>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50 space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                        <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">Cloud Database Status</p>
                        <div className="flex items-baseline space-x-6">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{cloudMembers.length}</span>
                                <span className="text-xs text-slate-500 font-bold">Members</span>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-lg font-black text-slate-700 dark:text-slate-300">{cloudPayments.length}</span>
                                <span className="text-[10px] text-slate-500 font-medium lowercase">Payments</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={handleCloudBackup}
                            className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-98 shadow-lg shadow-blue-500/20"
                        >
                            <div className="flex items-center space-x-3">
                                <CloudUpload size={20} />
                                <span>Download Cloud Backup (JSON)</span>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-500 ml-2">Danger Zone</h3>
                <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-500/20">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-rose-200 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-rose-700 dark:text-rose-400">Factory Reset</h3>
                            <p className="text-sm text-rose-600/70 dark:text-rose-400/70">Requires Admin Authentication</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="w-full py-3 bg-white dark:bg-rose-500 text-rose-600 dark:text-white font-bold rounded-xl border border-rose-200 dark:border-transparent shadow-sm active:scale-95 transition-all"
                    >
                        Erasure Everything
                    </button>
                </div>
            </section>

            <div className="text-center">
                <p className="text-xs text-slate-400 font-mono">Manhaj v1.2.0</p>
            </div>

            {/* Password Validation Modal */}
            {promptState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
                        <button
                            onClick={closePrompt}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{promptState.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{promptState.message}</p>
                        </div>

                        <form onSubmit={handlePromptSubmit} className="space-y-4" autoComplete="off">
                            <div className="relative">
                                <input
                                    autoFocus
                                    type={showPromptPassword ? "text" : "password"}
                                    placeholder="Enter Admin Password"
                                    autoComplete="new-password"
                                    value={promptPassword}
                                    onChange={e => setPromptPassword(e.target.value)}
                                    className="w-full text-center text-lg font-bold tracking-widest px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPromptPassword(!showPromptPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1"
                                >
                                    {showPromptPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {promptError && (
                                <p className="text-rose-500 text-xs text-center font-bold bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                    {promptError}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                            >
                                Confirm Access
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
