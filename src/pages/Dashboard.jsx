import { useEffect, useState } from 'react';
import { getDashboardStats } from '../db/db';
import { Users, CreditCard, AlertCircle, Plus, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, active }) => (
    <button
        onClick={onClick}
        className={`w-full text-left bg-white dark:bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl border transition-all active:scale-95 relative overflow-hidden ${active ? 'border-blue-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20' : 'border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none'}`}
    >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 ${active ? 'text-blue-500 dark:text-blue-400' : color.replace('bg-', 'text-')}`}>
                <Icon size={20} />
            </div>
        </div>
    </button>
);

export default function Dashboard() {
    const [stats, setStats] = useState({ totalMembers: 0, totalCollected: 0, totalPending: 0, members: [], pendingMembers: [] });
    const [selectedTab, setSelectedTab] = useState(null); // 'total' or 'pending'

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Members"
                    value={stats.totalMembers}
                    icon={Users}
                    color="bg-blue-500"
                    active={selectedTab === 'total'}
                    onClick={() => setSelectedTab(selectedTab === 'total' ? null : 'total')}
                />
                <StatCard
                    title="Total Collected"
                    value={`₹${stats.totalCollected.toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-green-500"
                    subtext="Lifetime collection"
                    onClick={() => setSelectedTab(null)}
                />
                <StatCard
                    title="Pending Dues"
                    value={`₹${stats.totalPending.toLocaleString()}`}
                    icon={AlertCircle}
                    color="bg-orange-500"
                    active={selectedTab === 'pending'}
                    onClick={() => setSelectedTab(selectedTab === 'pending' ? null : 'pending')}
                />
            </div>

            {/* List View */}
            {selectedTab && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-mono">
                            {selectedTab === 'total' ? 'All Members List' : 'Outstanding Dues List'}
                        </h2>
                        <button onClick={() => setSelectedTab(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {(selectedTab === 'total' ? stats.members : stats.pendingMembers).map(member => (
                            <Link
                                key={member.id}
                                to={`/members/${member.id}`}
                                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group active:scale-[0.99] shadow-sm dark:shadow-none"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{member.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">ID: #{member.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {selectedTab === 'pending' && (
                                        <p className="text-sm font-black text-orange-500">₹{member.balance}</p>
                                    )}
                                    <ChevronRight size={16} className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Link to="/members/add" className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 active:scale-95 transition-all">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Plus size={24} className="text-white" />
                        </div>
                        <span className="font-medium text-sm text-white">Add Member</span>
                    </Link>

                    <Link to="/members" className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-slate-200 dark:border-slate-700 transition-colors active:scale-95 shadow-sm dark:shadow-none">
                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                            <Users size={24} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-sm text-slate-600 dark:text-slate-300">View Directory</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
