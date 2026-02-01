import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentsByMember, toggleMonthPaid, deleteMember, getMemberWithBalance, updateMember, recordPayment, deletePayment } from '../db/db';
import { Phone, Trash2, CheckCircle2, History, Clock, Edit2, X, Save, CreditCard, ArrowRight } from 'lucide-react';
import { format, startOfMonth, addMonths, isBefore, parseISO } from 'date-fns';

export default function MemberDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [selectedMonthStatus, setSelectedMonthStatus] = useState(null);
    const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false); // Renamed for clarity
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCustomAmountModalOpen, setIsCustomAmountModalOpen] = useState(false);
    const [selectedMonthDate, setSelectedMonthDate] = useState(null);
    const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
    const [paymentToRevert, setPaymentToRevert] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const m = await getMemberWithBalance(id);
            if (!m) {
                alert('Member not found');
                navigate('/members');
                return;
            }
            setMember(m);
            setEditData({
                name: m.name,
                phone: m.phone,
                subscriptionAmount: m.subscriptionAmount,
                joinDate: m.joinDate
            });

            const p = await getPaymentsByMember(parseInt(id));
            // Sort payments by recorded date (newest first)
            p.sort((a, b) => new Date(b.date) - new Date(a.date));
            setPayments(p);
            setLoading(false);
        } catch (error) {
            console.error("Error loading member details:", error);
        }
    };

    const handlePostPayment = async (amount, isFull = false) => {
        if (isFull) {
            await recordPayment(member.id, amount, selectedMonthDate.getMonth(), selectedMonthDate.getFullYear());
        } else {
            await recordPayment(member.id, amount);
        }
        setIsPaymentModalOpen(false);
        loadData();
    };

    const handleCustomPayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Record the payment with the month/year context of the selected grid item
        if (selectedMonthDate) {
            await recordPayment(member.id, amount, selectedMonthDate.getMonth(), selectedMonthDate.getFullYear());
        } else {
            await recordPayment(member.id, amount);
        }

        setIsCustomAmountModalOpen(false);
        setCustomAmount('');
        loadData();
    };

    const handleDeleteMember = async () => { // Renamed for clarity
        if (confirm('Are you sure you want to delete this member?')) {
            await deleteMember(parseInt(id));
            navigate('/members');
        }
    };

    const handleUpdateMember = async (e) => {
        e.preventDefault();
        try {
            await updateMember({
                ...member,
                ...editData
            });
            setIsEditModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Failed to update member');
        }
    };

    if (loading || !member) return <div className="p-10 text-center text-slate-500">Loading...</div>;

    // Calculate grid items using chronological coverage logic
    const joinDate = startOfMonth(parseISO(member.joinDate));
    const today = startOfMonth(new Date());
    const monthlyFee = parseFloat(member.subscriptionAmount) || 0;

    // Pool all lifetime payments
    const totalPaidEver = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const openingDues = parseFloat(member.openingBalance || 0);
    let remainingToCover = totalPaidEver;

    const gridItems = [];

    // 1. First cover Opening Dues
    if (openingDues > 0) {
        let status = 'unpaid';
        let coverageAmount = 0;
        // Use epsilon buffer to handle rounding differences
        if (remainingToCover >= (openingDues - 0.01)) {
            status = 'paid';
            coverageAmount = openingDues;
            remainingToCover -= openingDues;
        } else if (remainingToCover > 0.01) {
            status = 'partial';
            coverageAmount = remainingToCover;
            remainingToCover = 0;
        }
        gridItems.push({
            type: 'opening',
            label: 'Opening Due',
            status,
            coverageAmount,
            total: openingDues
        });
    }

    // 2. Then cover months
    let current = joinDate;
    // Show months up to today, OR further into the future if they have coverage
    // Determine the furthest month to display based on today and any remaining credit
    let endLimit = addMonths(today, 1); // Default to one month past today
    if (remainingToCover > 0) {
        // If there's remaining credit, calculate how many future months it can cover
        const futureMonthsCovered = Math.ceil(remainingToCover / monthlyFee);
        endLimit = addMonths(endLimit, futureMonthsCovered);
    }

    while (current <= endLimit) {
        let status = 'unpaid';
        let coverageAmount = 0;

        // Use epsilon to handle floating point precision
        if (remainingToCover >= (monthlyFee - 0.01)) {
            remainingToCover -= monthlyFee;
            status = 'paid';
            coverageAmount = monthlyFee;
        } else if (remainingToCover > 0.01) {
            status = 'partial';
            coverageAmount = Math.round(remainingToCover * 100) / 100;
            remainingToCover = 0;
        }

        gridItems.push({
            type: 'month',
            date: current,
            status,
            coverageAmount
        });
        current = addMonths(current, 1);
        if (gridItems.length > 120) break;
    }
    gridItems.reverse();

    const handleToggleMonth = async (item) => {
        if (item.status === 'paid') {
            if (item.type === 'opening') {
                alert('Opening Dues are covered by pool payments. Delete the oldest payments in history to change this.');
                return;
            }

            // Find the specific record for this month
            const month = item.date?.getMonth();
            const year = item.date?.getFullYear();
            const p = month !== undefined ? payments.find(p => p.forMonth === month && p.forYear === year) : null;

            if (p) {
                setPaymentToRevert(p);
                setSelectedMonthDate(item.date);
                setIsRevertModalOpen(true);
            } else {
                alert('Paid via credit rollover. Please delete the original overpayment in the history below.');
            }
        } else {
            // Unpaid or Partial
            let recordToRevert = null;
            if (item.date) {
                const month = item.date.getMonth();
                const year = item.date.getFullYear();
                recordToRevert = payments.find(p => p.forMonth === month && p.forYear === year);
            }

            // If it's a partial month and no specific record exists for that month,
            // fallback to the most recent payment to allow some form of revert action.
            if (!recordToRevert && item.status === 'partial') {
                recordToRevert = payments[0];
            }

            setPaymentToRevert(recordToRevert);
            setSelectedMonthDate(item.date || new Date());
            setSelectedMonthStatus(item.status);
            setPaymentAmount(member.subscriptionAmount);
            setIsPaymentModalOpen(true);
        }
    };

    const handleConfirmRevert = async () => {
        if (paymentToRevert) {
            await deletePayment(paymentToRevert.id);
            setIsRevertModalOpen(false);
            setPaymentToRevert(null);
            loadData();
        }
    };

    // Filter payments to only show monthly fee records for the history list
    const monthWiseHistory = payments.filter(p => p.forMonth !== undefined);

    return (
        <div className="animate-fade-in space-y-6 pb-24 relative min-h-[90vh]">
            {/* Profile Info Card */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${member.balance > 0 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500' : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500'}`}>
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{member.name}</h1>
                            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mt-1">
                                <Phone size={14} />
                                <span className="text-sm font-medium">{member.phone}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-500 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-600/30"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={handleDeleteMember}
                            className="p-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl text-rose-500 transition-all border border-rose-100 dark:border-rose-500/20"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1 font-mono">Total Due</p>
                        <p className={`text-2xl font-black ${member.totalDue > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                            ₹{Math.round(member.totalDue)}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1 font-mono">Monthly Fee</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{member.subscriptionAmount}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 col-span-2 md:col-span-1 ${member.advanceCredit > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900/50 opacity-50'}`}>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1 font-mono">Advance Credit</p>
                        <p className={`text-2xl font-black ${member.advanceCredit > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`}>
                            ₹{member.advanceCredit}
                        </p>
                    </div>
                </div>
            </div>

            {/* Breakdown Summary */}
            <div className="bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/30 rounded-3xl p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2 font-mono">Breakdown</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400">Unpaid Months ({member.unpaidMonthsCount})</span>
                        <span className="text-slate-900 dark:text-white">₹{member.unpaidMonthsCount * (parseFloat(member.subscriptionAmount) || 0)}</span>
                    </div>
                    {member.openingDues > 0 && (
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Old Opening Balance</span>
                            <span className="text-slate-900 dark:text-white">₹{member.openingDues}</span>
                        </div>
                    )}
                    {member.advanceCredit > 0 && (
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-emerald-600 dark:text-emerald-500 font-bold">Advance Credit Rollover</span>
                            <span className="text-emerald-600 dark:text-emerald-500">₹{member.advanceCredit}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase font-mono">Grand Total Due</span>
                        <span className={`text-lg font-black ${member.totalDue > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                            ₹{Math.round(member.totalDue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Sheet Window */}
            <div className="bg-white dark:bg-slate-200 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-300 rounded-full -mr-16 -mt-16 opacity-50"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Sheet</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">TAP TO TOGGLE STATUS</p>
                    </div>
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        ID: #{member.id}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {gridItems.map((item, idx) => {
                        const getStatusStyles = (status) => {
                            switch (status) {
                                case 'paid': return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 shadow-sm shadow-emerald-500/5';
                                case 'partial': return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
                                default: return 'bg-slate-50 dark:bg-slate-100 border-slate-200 dark:border-slate-300 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-200 transition-colors';
                            }
                        }
                        return (
                            <button
                                key={idx}
                                onClick={() => handleToggleMonth(item)}
                                className={`p-4 rounded-[1.5rem] border-2 flex items-center justify-between transition-all active:scale-95 relative overflow-hidden ${getStatusStyles(item.status)}`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{item.label || format(item.date, 'MMM yyyy')}</p>
                                        <h4 className="text-lg font-black tracking-tight">{item.status === 'paid' ? 'Paid' : (item.status === 'partial' ? 'Part Paid' : 'Unpaid')}</h4>
                                        <div className="flex items-center space-x-1">
                                            <p className="text-xs font-bold font-mono">₹{item.coverageAmount}</p>
                                            {item.status === 'paid' && <CheckCircle2 size={12} className="text-emerald-500" />}
                                        </div>
                                    </div>
                                </div>

                                {item.status === 'paid' && (
                                    <CheckCircle2
                                        className="absolute -right-4 -top-4 text-emerald-500/30"
                                        size={100}
                                        strokeWidth={3}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-300 flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-emerald-500 dark:text-emerald-600 font-black uppercase tracking-tighter">
                            {gridItems.filter(m => m.status === 'paid').length} Paid
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-400 rounded-full"></span>
                        <span className="text-[11px] text-orange-500 font-black uppercase tracking-tighter">
                            {gridItems.filter(m => m.status === 'partial').length} Partial
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-400 rounded-full"></span>
                        <span className="text-[11px] text-rose-500 font-black uppercase tracking-tighter">
                            {gridItems.filter(m => m.status === 'unpaid').length} Pending
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment History List */}
            {payments.length > 0 && (
                <div id="payment-history" className="space-y-4 px-2">
                    <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
                        <History size={16} />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Payment History</h3>
                    </div>

                    <div className="space-y-3">
                        {payments.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 p-4 rounded-2xl flex justify-between items-center group active:scale-98 transition-all relative overflow-hidden shadow-sm dark:shadow-none">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-xl ${p.forMonth !== undefined ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500'}`}>
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-tight">
                                            {p.forMonth !== undefined
                                                ? `${p.mode === 'Monthly Fee' ? 'Monthly Fee:' : 'Partial Pay:'} ${format(new Date(p.forYear, p.forMonth), 'MMMM yyyy')}`
                                                : 'Manual Payment'}
                                        </p>
                                        <div className="flex items-center space-x-1 text-slate-500 mt-1">
                                            <Clock size={10} />
                                            <p className="text-[10px] font-medium font-mono uppercase">
                                                {format(new Date(p.date), 'dd MMM yyyy • h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 relative z-10">
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${p.forMonth !== undefined ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'}`}>₹{Math.round(p.amount)}</p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">SUCCESS</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPaymentToRevert(p);
                                            setSelectedMonthDate(p.forMonth !== undefined ? new Date(p.forYear, p.forMonth) : new Date(p.date));
                                            setIsRevertModalOpen(true);
                                        }}
                                        className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl opacity-0 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                        title="Delete this transaction"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-[2rem] overflow-hidden relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateMember} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Member Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fee Amount</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editData.subscriptionAmount}
                                    onChange={e => setEditData({ ...editData, subscriptionAmount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Join Date</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editData.joinDate}
                                    onChange={e => setEditData({ ...editData, joinDate: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center space-x-2 mt-4"
                            >
                                <Save size={20} />
                                <span>Save Changes</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Modal */}
            {isPaymentModalOpen && selectedMonthDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 pb-4 text-center relative">
                            {selectedMonthStatus === 'partial' && paymentToRevert && (
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setIsRevertModalOpen(true);
                                    }}
                                    className="absolute top-6 right-6 p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all active:scale-90 border border-rose-100"
                                    title="Revert to Unpaid"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="text-blue-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {selectedMonthStatus === 'partial' ? 'Settle Payment' : 'Record Payment'}
                            </h3>
                            <p className="text-slate-500 font-medium mt-1">
                                {selectedMonthStatus === 'partial'
                                    ? `This month is partially paid. Enter the balance for ${format(selectedMonthDate, 'MMMM yyyy')}.`
                                    : `Choose payment type for ${format(selectedMonthDate, 'MMMM yyyy')}`
                                }
                            </p>
                        </div>

                        <div className="p-8 pt-2 space-y-3">
                            {selectedMonthStatus !== 'partial' && (
                                <button
                                    onClick={() => handlePostPayment(member.subscriptionAmount, true)}
                                    className="w-full bg-emerald-600 text-white p-6 rounded-2xl flex items-center justify-between group active:scale-95 transition-all text-left shadow-lg shadow-emerald-100"
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Standard Fee</p>
                                        <p className="text-xl font-black">Full Payment</p>
                                        <p className="text-xs font-bold text-emerald-200 mt-1">₹{member.subscriptionAmount}</p>
                                    </div>
                                    <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg">
                                        <CheckCircle2 size={20} />
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setIsCustomAmountModalOpen(true);
                                }}
                                className="w-full bg-blue-50 text-blue-700 p-6 rounded-2xl flex items-center justify-between group active:scale-95 transition-all text-left border-2 border-blue-100"
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        {selectedMonthStatus === 'partial' ? 'Complete Payment' : 'Reduce Balance'}
                                    </p>
                                    <p className="text-xl font-black">
                                        {selectedMonthStatus === 'partial' ? 'Pay Remaining' : 'Partial Payment'}
                                    </p>
                                    <p className="text-xs font-bold text-blue-400 mt-1">Enter custom amount</p>
                                </div>
                                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                                    <ArrowRight size={20} />
                                </div>
                            </button>

                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-2"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Amount Modal */}
            {isCustomAmountModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsCustomAmountModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 pb-4">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Custom Amount</h3>
                                {member.totalDue > 0 ? (
                                    <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                        <p className="text-[10px] font-black text-orange-600 uppercase">Due: ₹{member.totalDue}</p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase">Credit: ₹{member.advanceCredit}</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium">
                                Enter the partial payment amount
                            </p>
                        </div>

                        <form onSubmit={handleCustomPayment} className="p-8 pt-2 space-y-6">
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
                                <input
                                    autoFocus
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-10 py-5 text-3xl font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    placeholder="0"
                                    value={customAmount}
                                    onChange={e => setCustomAmount(e.target.value)}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomAmountModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Revert/Delete Payment Modal */}
            {isRevertModalOpen && paymentToRevert && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsRevertModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 pb-4 text-center">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-rose-500" size={30} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Payment?</h3>
                            <p className="text-slate-500 font-medium mt-1">
                                {paymentToRevert.forMonth !== undefined
                                    ? `Remove payment for ${format(new Date(paymentToRevert.forYear, paymentToRevert.forMonth), 'MMMM yyyy')}?`
                                    : 'Remove this general payment record?'
                                }
                            </p>

                            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction to Delete</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Monthly Fee</span>
                                    <span className="text-lg font-black text-slate-900">₹{paymentToRevert.amount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsRevertModalOpen(false)}
                                className="py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRevert}
                                className="bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all"
                            >
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
