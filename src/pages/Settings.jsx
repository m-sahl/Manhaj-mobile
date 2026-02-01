import { useState, useEffect } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Database, ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initDB } from '../db/db';

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

    const openPrompt = (title, message, onSuccess) => {
        setPromptState({ isOpen: true, title, message, onSuccess });
        setPromptPassword('');
    };

    const closePrompt = () => {
        setPromptState({ ...promptState, isOpen: false });
        setPromptPassword('');
    };

    const handlePromptSubmit = (e) => {
        e.preventDefault();
        const stored = localStorage.getItem('admin_password') || 'admin123';
        if (promptPassword === stored) {
            promptState.onSuccess();
            closePrompt();
        } else {
            alert('Incorrect password');
        }
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
        loadStats();
    }, [theme]);

    const loadStats = async () => {
        const db = await initDB();
        const m = await db.count('members');
        const p = await db.count('payments');
        setStats({ members: m, payments: p });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };



    // Password Management State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    const handleChangePassword = () => {
        const stored = localStorage.getItem('admin_password') || 'admin123';
        if (passData.current !== stored) {
            alert('Current password is incorrect');
            return;
        }
        if (passData.new.length < 4) {
            alert('New password must be at least 4 characters');
            return;
        }
        if (passData.new !== passData.confirm) {
            alert('New passwords do not match');
            return;
        }

        localStorage.setItem('admin_password', passData.new);
        alert('Password updated successfully');
        setIsChangingPassword(false);
        setPassData({ current: '', new: '', confirm: '' });
    };

    const handleBackup = async () => {
        const db = await initDB();
        const members = await db.getAll('members');
        const payments = await db.getAll('payments');

        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            members,
            payments
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Manhaj_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('WARNING: This will overwrite your current data. Are you sure?')) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Validate basic structure
                if (!data.members || !data.payments) throw new Error("Invalid backup file");

                const db = await initDB();
                const tx = db.transaction(['members', 'payments'], 'readwrite');

                // Clear existing
                await tx.objectStore('members').clear();
                await tx.objectStore('payments').clear();

                // Import new
                for (const m of data.members) await tx.objectStore('members').add(m);
                for (const p of data.payments) await tx.objectStore('payments').add(p);

                await tx.done;
                alert('Data restored successfully! App will reload.');
                window.location.reload();
            } catch (err) {
                alert('Failed to restore data: ' + err.message);
            }
        };
        reader.readAsText(file);
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

    const handleReset = () => {
        openPrompt(
            "Factory Reset Function",
            "This action is irreversible. All data will be permanently deleted.",
            async () => {
                const db = await initDB();
                const tx = db.transaction(['members', 'payments'], 'readwrite');
                await tx.objectStore('members').clear();
                await tx.objectStore('payments').clear();
                await tx.done;

                alert('Factory Reset Complete. Protocol Zero Initiated.');
                window.location.reload();
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
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-3 animate-fade-in border border-slate-200 dark:border-slate-700">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passData.current}
                                onChange={e => setPassData({ ...passData, current: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passData.new}
                                onChange={e => setPassData({ ...passData, new: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passData.confirm}
                                onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <button
                                onClick={handleChangePassword}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
                            >
                                Update Password
                            </button>
                        </div>
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
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase font-black">Members</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.members}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase font-black">Records</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.payments}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleBackup}
                            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-98"
                        >
                            <div className="flex items-center space-x-3">
                                <Download size={20} />
                                <span>Backup Data (JSON)</span>
                            </div>
                        </button>

                        <label className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-98 cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <Upload size={20} />
                                <span>Restore Data</span>
                            </div>
                            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                        </label>
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

                        <form onSubmit={handlePromptSubmit} className="space-y-4">
                            <input
                                autoFocus
                                type="password"
                                placeholder="Enter Admin Password"
                                value={promptPassword}
                                onChange={e => setPromptPassword(e.target.value)}
                                className="w-full text-center text-lg font-bold tracking-widest px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
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
