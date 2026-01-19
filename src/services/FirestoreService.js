import { db, auth } from '../firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

class FirestoreService {
    // --- User context ---
    getUserId() {
        return auth.currentUser?.uid || 'anonymous'; // 임시로 anonymous 사용 (나중에 Auth 강화 시 필수)
    }

    // --- Children ---
    async saveChild(childInfo) {
        const uid = this.getUserId();
        const childRef = doc(db, 'users', uid, 'children', String(childInfo.id));
        await setDoc(childRef, {
            ...childInfo,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return childInfo;
    }

    async getChildren() {
        const uid = this.getUserId();
        const q = query(collection(db, 'users', uid, 'children'), orderBy('id', 'asc'));
        const querySnapshot = await getDocs(q);
        const children = [];
        querySnapshot.forEach((doc) => {
            children.push(doc.data());
        });
        return children;
    }

    async deleteChild(childId) {
        const uid = this.getUserId();
        await deleteDoc(doc(db, 'users', uid, 'children', String(childId)));
    }

    // --- Observation Logs ---
    async saveLog(logEntry) {
        const uid = this.getUserId();
        const logRef = doc(db, 'users', uid, 'logs', String(logEntry.id));
        await setDoc(logRef, {
            ...logEntry,
            updatedAt: serverTimestamp()
        });
        return logEntry;
    }

    async getLogs(childId) {
        const uid = this.getUserId();
        const logsRef = collection(db, 'users', uid, 'logs');
        let q;
        if (childId) {
            q = query(logsRef, where('childId', '==', childId), orderBy('id', 'desc'));
        } else {
            q = query(logsRef, orderBy('id', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const logs = [];
        querySnapshot.forEach((doc) => {
            logs.push(doc.data());
        });
        return logs;
    }

    async deleteLog(logId) {
        const uid = this.getUserId();
        await deleteDoc(doc(db, 'users', uid, 'logs', String(logId)));
    }

    // --- Checklist ---
    async saveChecklist(childId, checkedItems) {
        if (!childId) return;
        const uid = this.getUserId();
        // 경로 변경: users/{uid}/children/{childId}/status/checklist
        const statusRef = doc(db, 'users', uid, 'children', String(childId), 'status', 'checklist');
        await setDoc(statusRef, {
            items: checkedItems,
            updatedAt: serverTimestamp()
        });
    }

    async getChecklist(childId) {
        if (!childId) return {};
        const uid = this.getUserId();
        const statusRef = doc(db, 'users', uid, 'children', String(childId), 'status', 'checklist');
        const docSnap = await getDoc(statusRef);
        return docSnap.exists() ? docSnap.data().items : {};
    }

    // --- Growth Data ---
    async saveGrowthEntry(entry) {
        const uid = this.getUserId();
        const growthRef = doc(db, 'users', uid, 'growth', String(entry.id));
        await setDoc(growthRef, {
            ...entry,
            updatedAt: serverTimestamp()
        });
        return entry;
    }

    async getGrowthData(childId) {
        const uid = this.getUserId();
        const growthRef = collection(db, 'users', uid, 'growth');
        const q = query(growthRef, where('childId', '==', childId), orderBy('id', 'asc'));
        const querySnapshot = await getDocs(q);
        const entries = [];
        querySnapshot.forEach((doc) => {
            entries.push(doc.data());
        });
        return entries;
    }

    async deleteGrowthEntry(entryId) {
        const uid = this.getUserId();
        await deleteDoc(doc(db, 'users', uid, 'growth', String(entryId)));
    }
}

export default new FirestoreService();
