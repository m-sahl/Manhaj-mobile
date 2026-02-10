import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const isInitialized = useQuery(api.auth.isAdminInitialized);
    const verifyMutation = useMutation(api.auth.verify);
    const initMutation = useMutation(api.auth.initAdmin);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Wait for query to load if needed
            if (isInitialized === undefined) return;

            // Auto-init if no admin exists (first time run)
            if (!isInitialized) {
                if (password.length < 4) {
                    setError('Set a password of at least 4 characters');
                    return;
                }
                await initMutation({ password });
                localStorage.setItem('auth_token', 'valid_token');
                if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
                navigate('/');
                return;
            }

            const result = await verifyMutation({ password });
            if (result.success) {
                localStorage.setItem('auth_token', 'valid_token');
                if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
                navigate('/');
            } else {
                setError(result.message || 'Invalid admin password');
                setPassword(''); // Remove entered password on failure
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            setPassword(''); // Remove entered password on failure
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 transition-colors duration-300">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent mb-2">
                        Manhaj Admin
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {isInitialized === false ? 'Set Admin Password' : 'Enter secure access code'}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isInitialized === false ? "Choose New Password" : "Admin Password"}
                            autoComplete="new-password"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center tracking-widest text-lg font-bold shadow-inner"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {error && <p className="text-rose-500 text-sm text-center font-bold bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40 transition-all transform active:scale-95 text-lg"
                    >
                        {isInitialized === false ? 'Set Password & Login' : 'Unlock Dashboard'}
                    </button>
                </form>
            </div>
            <p className="mt-8 text-slate-400 dark:text-slate-600 text-xs font-mono">SECURE SYSTEM ACCESS</p>
        </div>
    );
}
