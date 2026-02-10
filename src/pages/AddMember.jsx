import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Save } from 'lucide-react';

export default function AddMember() {
    const navigate = useNavigate();
    const addMember = useMutation(api.members.add);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        subscriptionAmount: '500', // Default
        subscriptionType: 'Monthly',
        balance: '0', // Initial Pending Dues?
        joinDate: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addMember({
                ...formData,
                subscriptionAmount: parseFloat(formData.subscriptionAmount),
                balance: parseFloat(formData.balance) || 0,
            });
            navigate('/members');
        } catch (error) {
            console.error(error);
            alert('Failed to save member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in relative min-h-[80vh] space-y-6">
            <div className="flex items-center space-x-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 active:scale-90 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Add New Member</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the details to register</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">Full Name</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-none"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">Phone Number</label>
                        <input
                            required
                            type="tel"
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-none"
                            placeholder="e.g. 9876543210"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">Join Date</label>
                        <input
                            required
                            type="date"
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium shadow-sm dark:shadow-none"
                            value={formData.joinDate}
                            onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">Fee Amount</label>
                        <input
                            required
                            type="number"
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium shadow-sm dark:shadow-none"
                            value={formData.subscriptionAmount}
                            onChange={e => setFormData({ ...formData, subscriptionAmount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">Cycle</label>
                        <select
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none shadow-sm dark:shadow-none"
                            value={formData.subscriptionType}
                            onChange={e => setFormData({ ...formData, subscriptionType: e.target.value })}
                        >
                            <option>Monthly</option>
                            <option>Yearly</option>
                            <option>One-Time</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1 text-orange-500 dark:text-orange-400">Initial Pending Dues</label>
                    <input
                        type="number"
                        className="w-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium shadow-sm dark:shadow-none placeholder-orange-300 dark:placeholder-orange-500/50"
                        placeholder="0"
                        value={formData.balance}
                        onChange={e => setFormData({ ...formData, balance: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">Set this if the member already owes money from before.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2 z-20"
                    style={{ width: 'calc(100% - 32px)' }}
                >
                    <Save size={20} />
                    <span>{loading ? 'Saving...' : 'Save Member'}</span>
                </button>

            </form>
        </div>
    );
}
