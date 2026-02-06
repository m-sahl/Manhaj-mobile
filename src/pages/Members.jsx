import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { calculateMemberStats } from '../utils/stats';
import { Search, User, ChevronRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Members() {
    const membersData = useQuery(api.members.list);
    const paymentsData = useQuery(api.payments.list, {});
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const members = (membersData && paymentsData)
        ? membersData.map(m => calculateMemberStats(m, paymentsData))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search)
    );

    return (
        <div className="animate-fade-in space-y-4 min-h-[80vh]">
            <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search name or phone..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-3 pb-20">
                {filteredMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                        <User size={48} className="text-slate-700" />
                        <p>No members found</p>
                    </div>
                ) : (
                    filteredMembers.map(member => (
                        <Link
                            key={member._id}
                            to={`/members/${member._id}`}
                            className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between transition-all group no-underline shadow-sm dark:shadow-none"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${parseFloat(member.balance) > 0 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500' : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500'}`}>
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-medium text-base">{member.name}</h3>
                                    <p className="text-slate-500 text-xs">{member.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <span className={`text-xs font-bold uppercase py-0.5 px-2 rounded-full ${parseFloat(member.balance) > 0 ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500'}`}>
                                        {parseFloat(member.balance) > 0 ? `Due ₹${member.balance}` : 'Paid'}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <Link
                to="/members/add"
                className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/40 dark:shadow-blue-900/40 flex items-center justify-center active:scale-90 transition-transform z-20"
            >
                <Plus size={28} />
            </Link>
        </div>
    );
}
