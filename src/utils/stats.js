export const calculateMemberStats = (member, payments) => {
    if (!member) return null;

    // Filter payments for this member and sort by date
    const memberPayments = payments.filter(p => p.memberId === member._id);

    // Total lifetime payments
    const totalPaid = Math.round(memberPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 100) / 100;
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

    // Final Balance calculation
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
