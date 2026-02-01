import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const storedPassword = localStorage.getItem('admin_password') || 'admin123';
        if (password === storedPassword) {
            localStorage.setItem('auth_token', 'valid_token');
            // Ensure theme is initialized
            if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
            navigate('/');
        } else {
            setError('Invalid admin password');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 transition-colors duration-300">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent mb-2">
                        Manhaj Admin
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Enter secure access code</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin Password"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center tracking-widest text-lg font-bold shadow-inner"
                        />
                    </div>
                    {error && <p className="text-rose-500 text-sm text-center font-bold bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40 transition-all transform active:scale-95 text-lg"
                    >
                        Unlock Dashboard
                    </button>
                </form>
            </div>
            <p className="mt-8 text-slate-400 dark:text-slate-600 text-xs font-mono">SECURE SYSTEM ACCESS</p>
        </div>
    );
}
