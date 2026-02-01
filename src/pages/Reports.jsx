import { useEffect, useState } from 'react';
import { getAllPayments, getMembers } from '../db/db';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { FileText, TrendingUp, Download } from 'lucide-react';

export default function Reports() {
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [filter, setFilter] = useState('month'); // 'day', 'month', 'all'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [pData, mData] = await Promise.all([
            getAllPayments(),
            getMembers()
        ]);
        // Sort desc
        pData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPayments(pData);
        setMembers(mData);
    };

    const getMemberName = (id) => {
        const m = members.find(m => m.id === id);
        return m ? m.name : 'Unknown';
    };

    const getFilteredPayments = () => {
        const now = new Date();
        return payments.filter(p => {
            const d = new Date(p.date);
            if (filter === 'day') return isSameDay(d, now);
            if (filter === 'month') return isSameMonth(d, now);
            return true;
        });
    };

    const handleDownloadPDF = () => {
        const filtered = getFilteredPayments();
        if (filtered.length === 0) {
            alert('No records to download');
            return;
        }

        // Access jspdf from window
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("MANHAJ", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Collection Report: ${filter === 'day' ? 'Today' : filter === 'month' ? format(new Date(), 'MMMM yyyy') : 'All Time'}`, 14, 28);
        doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 33);

        const tableColumn = ["Member Name", "Amount", "For Month", "Recorded Date", "Mode"];
        const tableRows = filtered.map(p => [
            getMemberName(p.memberId),
            `Rs. ${p.amount}`,
            p.forMonth !== undefined ? format(new Date(p.forYear, p.forMonth), 'MMM yyyy') : 'Manual',
            format(new Date(p.date), 'dd MMM yyyy'),
            p.mode || 'Payment'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 40 },
            styles: { fontSize: 9 }
        });

        // Add sum at the bottom
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Collection: Rs. ${total.toLocaleString()}`, 14, finalY);

        doc.save(`Manhaj_Report_${filter}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const filtered = getFilteredPayments();
    const total = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Filters */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['day', 'month', 'all'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        {f === 'day' ? 'Today' : f === 'month' ? 'This Month' : 'All Time'}
                    </button>
                ))}
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-violet-200 text-sm font-medium mb-1 flex items-center space-x-2">
                            <TrendingUp size={16} />
                            <span>Total Collected ({filter === 'day' ? 'Today' : filter === 'month' ? format(new Date(), 'MMMM') : 'Total'})</span>
                        </p>
                        <h2 className="text-4xl font-bold text-white mb-2">₹{total.toLocaleString()}</h2>
                        <p className="text-violet-200 text-xs">{filtered.length} transactions found</p>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        className="bg-white/20 hover:bg-white/30 p-3 rounded-xl text-white transition-all active:scale-90 border border-white/10 flex items-center space-x-2"
                        title="Download Report"
                    >
                        <Download size={20} />
                        <span className="text-xs font-black uppercase tracking-tighter hidden md:inline">Download PDF</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">Recent Transactions</h3>

                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No records found for this period.</div>
                ) : (
                    filtered.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl flex justify-between items-center group active:scale-[0.99] transition-all shadow-sm dark:shadow-none">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${p.forMonth !== undefined ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500'}`}>
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-slate-900 dark:text-white text-sm font-black">{getMemberName(p.memberId)}</p>
                                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-tighter">
                                            {p.forMonth !== undefined
                                                ? format(new Date(p.forYear, p.forMonth), 'MMM yyyy')
                                                : 'General'
                                            }
                                        </p>
                                    </div>
                                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium mt-0.5">
                                        {format(new Date(p.date), 'dd MMM yyyy • h:mm a')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-black block ${p.forMonth !== undefined ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'}`}>₹{p.amount}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">{p.mode || 'Payment'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
