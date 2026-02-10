import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ArrowLeft, Settings } from 'lucide-react';
import { useEffect } from 'react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);


    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path === '/members') return 'Members';
        if (path === '/members/add') return 'New Member';
        if (path.startsWith('/members/')) return 'Member Profile';
        if (path.startsWith('/members/')) return 'Member Profile';
        if (path === '/reports') return 'Reports';
        if (path === '/settings') return 'Settings';
        return 'Manhaj';
    };

    const showBackButton = location.pathname !== '/' && location.pathname !== '/members' && location.pathname !== '/reports';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans flex flex-col transition-colors duration-300">
            {/* Unified Header */}
            <header className="glass sticky top-0 z-50 border-b border-slate-200 dark:border-white/5">
                <div className="px-5 py-4 flex justify-between items-center max-w-lg mx-auto w-full">
                    <div className="flex items-center space-x-3">
                        {showBackButton ? (
                            <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 rounded-full transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-500/20">M</div>
                        )}
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white capitalize">
                            {getPageTitle()}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-lg mx-auto w-full p-4">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-slate-200 dark:border-white/5 pb-safe z-50">
                <div className="flex justify-around items-center max-w-lg mx-auto w-full h-16">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <LayoutDashboard size={22} className={location.pathname === '/' ? 'scale-110' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
                    </NavLink>

                    <NavLink
                        to="/members"
                        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <Users size={22} className={location.pathname === '/members' ? 'scale-110' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Directory</span>
                    </NavLink>

                    <NavLink
                        to="/reports"
                        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <FileText size={22} className={location.pathname === '/reports' ? 'scale-110' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Reports</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <Settings size={22} className={location.pathname === '/settings' ? 'scale-110' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Settings</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}
