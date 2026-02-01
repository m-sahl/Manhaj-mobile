import { openDB } from 'idb';

const DB_NAME = 'subscription_manager_db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('members')) {
                const memberStore = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
                memberStore.createIndex('name', 'name', { unique: false });
                memberStore.createIndex('phone', 'phone', { unique: false });
            }
            if (!db.objectStoreNames.contains('payments')) {
                const paymentStore = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
                paymentStore.createIndex('memberId', 'memberId', { unique: false });
                paymentStore.createIndex('date', 'date', { unique: false });
            }
        },
    });
};

export const addMember = async (memberData) => {
    const db = await initDB();
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const id = await store.add({
        ...memberData,
        openingBalance: parseFloat(memberData.balance) || 0,
        joinDate: memberData.joinDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        active: true,
    });
    await tx.done;
    return id;
};

export const getMembers = async () => {
    const db = await initDB();
    return db.getAll('members');
};

export const updateMember = async (member) => {
    const db = await initDB();
    return db.put('members', member);
};

export const deleteMember = async (id) => {
    const db = await initDB();
    return db.delete('members', id);
};

export const deletePayment = async (id) => {
    const db = await initDB();
    return db.delete('payments', id);
};

export const addPayment = async (paymentData) => {
    const db = await initDB();
    const tx = db.transaction(['payments'], 'readwrite');

    const paymentStore = tx.objectStore('payments');
    const paymentId = await paymentStore.add({
        ...paymentData,
        date: paymentData.date || new Date().toISOString(),
    });

    await tx.done;
    return paymentId;
};

export const toggleMonthPaid = async (memberId, month, year, amount, isFull = true) => {
    const db = await initDB();
    const tx = db.transaction(['payments'], 'readwrite');
    const paymentStore = tx.objectStore('payments');

    // Check if payment already exists for this month/year
    const allPayments = await paymentStore.index('memberId').getAll(memberId);
    const existing = allPayments.find(p => p.forMonth === month && p.forYear === year);

    if (existing) {
        // Unmark: Delete payment
        await paymentStore.delete(existing.id);
    } else {
        // Mark: Add payment
        await paymentStore.add({
            memberId,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            forMonth: isFull ? month : undefined,
            forYear: isFull ? year : undefined,
            mode: isFull ? 'Full Payment' : 'Partial Payment'
        });
    }
    await tx.done;
};

// General function to record any payment
export const recordPayment = async (memberId, amount, forMonth = null, forYear = null) => {
    const db = await initDB();
    const tx = db.transaction(['payments'], 'readwrite');
    const paymentStore = tx.objectStore('payments');

    await paymentStore.add({
        memberId,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        forMonth: forMonth !== null ? forMonth : undefined,
        forYear: forYear !== null ? forYear : undefined,
        mode: forMonth !== null ? 'Monthly Fee' : 'Payment'
    });

    await tx.done;
};

// Function to manually add dues (e.g. at start of month)
export const addDue = async (memberId, amount) => {
    const db = await initDB();
    const tx = db.transaction('members', 'readwrite');
    const store = tx.objectStore('members');
    const member = await store.get(memberId);
    if (member) {
        member.openingBalance = (parseFloat(member.openingBalance) || 0) + parseFloat(amount);
        await store.put(member);
    }
    await tx.done;
}


export const getPaymentsByMember = async (memberId) => {
    const db = await initDB();
    const tx = db.transaction('payments', 'readonly');
    const index = tx.objectStore('payments').index('memberId');
    return index.getAll(memberId);
};

export const getAllPayments = async () => {
    const db = await initDB();
    return db.getAll('payments');
}

export const getMemberWithBalance = async (id) => {
    const db = await initDB();
    const member = await db.get('members', parseInt(id));
    if (!member) return null;

    const payments = await getPaymentsByMember(member.id);

    // Total lifetime payments (robust rounding)
    const totalPaid = Math.round(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 100) / 100;
    const openingDues = Math.round((parseFloat(member.openingBalance) || 0) * 100) / 100;
    const monthlyFee = Math.round((parseFloat(member.subscriptionAmount) || 0) * 100) / 100;

    // Chronological coverage calculation
    const joinDate = new Date(member.joinDate);
    // Use first day of month for calculation to avoid day-boundary issues
    let current = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    const today = new Date();
    const endLimit = new Date(today.getFullYear(), today.getMonth(), 1);

    let unpaidMonthsCount = 0;
    let totalMonthsCount = 0;
    let remainingToCover = Math.round((totalPaid - openingDues) * 100) / 100;

    while (current <= endLimit) {
        totalMonthsCount++;
        // Use 0.01 epsilon for robust threshold checking
        if (remainingToCover >= (monthlyFee - 0.01)) {
            remainingToCover = Math.round((remainingToCover - monthlyFee) * 100) / 100;
        } else if (remainingToCover > 0.01) {
            unpaidMonthsCount++;
            remainingToCover = 0;
        } else {
            unpaidMonthsCount++;
        }
        current.setMonth(current.getMonth() + 1);
    }

    // Final Balance calculation (Calculated chronologically to match obligation)
    const totalObligation = Math.round(((totalMonthsCount * monthlyFee) + openingDues) * 100) / 100;
    const finalBalance = Math.round((totalObligation - totalPaid) * 100) / 100;

    return {
        ...member,
        balance: finalBalance,
        totalDue: finalBalance > 0 ? finalBalance : 0,
        advanceCredit: finalBalance < 0 ? Math.abs(finalBalance) : 0,
        unpaidMonthsCount,
        openingDues,
        totalPaid
    };
};

export const getMembersWithStats = async () => {
    const db = await initDB();
    const members = await db.getAll('members');
    const results = [];
    for (const m of members) {
        results.push(await getMemberWithBalance(m.id));
    }
    return results;
};

export const getDashboardStats = async () => {
    const members = await getMembersWithStats();
    const payments = await getAllPayments();

    const totalMembers = members.length;
    const totalCollected = Math.round(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 100) / 100;
    const totalPending = Math.round(members.reduce((sum, m) => sum + (m.balance > 0 ? m.balance : 0), 0) * 100) / 100;

    return {
        totalMembers,
        totalCollected,
        totalPending,
        members,
        pendingMembers: members.filter(m => m.balance > 0)
    };
};
