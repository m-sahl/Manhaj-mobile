import { openDB } from 'idb';

const DB_NAME = 'manhaj_db';
const STORE_MEMBERS = 'members';
const STORE_PAYMENTS = 'payments';

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
                db.createObjectStore(STORE_MEMBERS, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
}

// Add Member
export async function addMember(member) {
    const db = await initDB();
    return db.add(STORE_MEMBERS, {
        ...member,
        createdAt: new Date().toISOString(),
        active: true
    });
}

// Get All Members
export async function getMembers() {
    const db = await initDB();
    return db.getAll(STORE_MEMBERS);
}

// Get All Payments
export async function getAllPayments() {
    const db = await initDB();
    return db.getAll(STORE_PAYMENTS);
}

// Delete Member
export async function deleteMember(id) {
    const db = await initDB();
    const tx = db.transaction([STORE_MEMBERS, STORE_PAYMENTS], 'readwrite');
    await tx.objectStore(STORE_MEMBERS).delete(id);

    // Clear associated payments
    const payments = await tx.objectStore(STORE_PAYMENTS).getAll();
    for (const p of payments) {
        if (p.memberId === id) {
            await tx.objectStore(STORE_PAYMENTS).delete(p.id);
        }
    }
    await tx.done;
}
