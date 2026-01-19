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
    // --- User Authentication ---
    async registerUser(userId, password, name) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            // 이미 존재하는 아이디인지 확인
            if (userDoc.exists()) {
                return { success: false, error: 'USER_EXISTS' };
            }

            // 새 사용자 등록
            await setDoc(userRef, {
                userId,
                password, // 실제 프로덕션에서는 해시화 필요
                name,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Firestore registerUser error:', error);
            return { success: false, error: error.message };
        }
    }

    async authenticateUser(userId, password) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return null;
            }

            const userData = userDoc.data();

            // 비밀번호 확인
            if (userData.password !== password) {
                return null;
            }

            return {
                userId: userData.userId,
                name: userData.name,
                createdAt: userData.createdAt
            };
        } catch (error) {
            console.error('Firestore authenticateUser error:', error);
            return null;
        }
    }

    async getUser(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return null;
            }

            const userData = userDoc.data();
            return {
                userId: userData.userId,
                name: userData.name,
                createdAt: userData.createdAt
            };
        } catch (error) {
            console.error('Firestore getUser error:', error);
            return null;
        }
    }

    // --- User context ---
    getUserId() {
        // localStorage에서 현재 사용자 가져오기
        const currentUser = localStorage.getItem('ssukdiary_current_user');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            return user.userId;
        }
        return 'anonymous'; // 임시로 anonymous 사용
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

    // --- Vaccination Records ---
    async saveVaccinationRecords(childId, records) {
        if (!childId) return;
        const uid = this.getUserId();
        const vaccinationRef = doc(db, 'users', uid, 'children', String(childId), 'status', 'vaccination');
        await setDoc(vaccinationRef, {
            records,
            updatedAt: serverTimestamp()
        });
    }

    async getVaccinationRecords(childId) {
        if (!childId) return {};
        const uid = this.getUserId();
        const vaccinationRef = doc(db, 'users', uid, 'children', String(childId), 'status', 'vaccination');
        const docSnap = await getDoc(vaccinationRef);
        return docSnap.exists() ? docSnap.data().records : {};
    }

    // --- Family Groups ---
    async saveFamilyGroup(familyGroup) {
        try {
            const groupRef = doc(db, 'familyGroups', familyGroup.familyGroupId);
            await setDoc(groupRef, {
                ...familyGroup,
                updatedAt: serverTimestamp()
            });
            return familyGroup;
        } catch (error) {
            console.error('Firestore saveFamilyGroup error:', error);
            throw error;
        }
    }

    async getFamilyGroup(familyGroupId) {
        try {
            const groupRef = doc(db, 'familyGroups', familyGroupId);
            const docSnap = await getDoc(groupRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error('Firestore getFamilyGroup error:', error);
            return null;
        }
    }

    async getFamilyGroupByInviteCode(inviteCode) {
        try {
            const q = query(collection(db, 'familyGroups'), where('inviteCode', '==', inviteCode.toUpperCase()));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            return querySnapshot.docs[0].data();
        } catch (error) {
            console.error('Firestore getFamilyGroupByInviteCode error:', error);
            return null;
        }
    }

    async getFamilyGroupsByUserId(userId) {
        try {
            // members 배열에서 userId가 포함된 그룹 찾기
            const groupsRef = collection(db, 'familyGroups');
            const allGroups = await getDocs(groupsRef);
            const userGroups = [];

            allGroups.forEach((doc) => {
                const group = doc.data();
                if (group.members && group.members.some(m => String(m.userId) === String(userId))) {
                    userGroups.push(group);
                }
            });

            return userGroups;
        } catch (error) {
            console.error('Firestore getFamilyGroupsByUserId error:', error);
            return [];
        }
    }

    // --- Health Records ---
    async saveHealthRecords(childId, records) {
        if (!childId) return;
        const uid = this.getUserId();
        const healthRef = doc(db, 'users', uid, 'children', String(childId), 'health', 'records');
        await setDoc(healthRef, {
            records,
            updatedAt: serverTimestamp()
        });
    }

    async getHealthRecords(childId) {
        if (!childId) return [];
        const uid = this.getUserId();
        const healthRef = doc(db, 'users', uid, 'children', String(childId), 'health', 'records');
        const docSnap = await getDoc(healthRef);
        return docSnap.exists() ? docSnap.data().records : [];
    }

    // --- User-Children Mapping ---
    async saveUserChildren(userId, childrenIds) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                children: childrenIds,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Firestore saveUserChildren error:', error);
        }
    }

    async getUserChildren(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                return data.children || [];
            }
            return [];
        } catch (error) {
            console.error('Firestore getUserChildren error:', error);
            return [];
        }
    }
}

export default new FirestoreService();
