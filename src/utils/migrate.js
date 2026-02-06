import { getMembers, getAllPayments, initDB } from '../db/db';
import { api } from '../../convex/_generated/api';

export const migrateToConvex = async (addMember, addPayment) => {
    try {
        console.log("Starting migration...");
        const members = await getMembers();
        const payments = await getAllPayments();

        console.log(`Found ${members.length} members and ${payments.length} payments.`);

        const idMap = {};

        for (const member of members) {
            console.log(`Migrating member: ${member.name}`);
            const { id, ...memberData } = member;
            const newId = await addMember({
                ...memberData,
                subscriptionAmount: parseFloat(member.subscriptionAmount),
                balance: parseFloat(member.openingBalance) || 0,
            });
            idMap[id] = newId;
        }

        for (const payment of payments) {
            console.log(`Migrating payment for member ID: ${payment.memberId}`);
            const { id, memberId, ...paymentData } = payment;
            const newMemberId = idMap[memberId];
            if (newMemberId) {
                await addPayment({
                    ...paymentData,
                    memberId: newMemberId,
                    amount: parseFloat(payment.amount),
                    forYear: payment.forYear ? parseInt(payment.forYear) : undefined,
                });
            }
        }

        console.log("Migration complete!");
        return true;
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};
