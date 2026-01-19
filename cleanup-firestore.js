// Firestore 데이터 정리 스크립트
// WARNING: 이 스크립트는 모든 아이 정보를 삭제합니다!

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase 설정 (firebase.js에서 복사)
const firebaseConfig = {
    apiKey: "AIzaSyBHkN-sQBY7KGcIx5NdK7zwdOqh5yZ1Grs",
    authDomain: "ssuckssuck-ac11c.firebaseapp.com",
    projectId: "ssuckssuck-ac11c",
    storageBucket: "ssuckssuck-ac11c.firebasestorage.app",
    messagingSenderId: "970634827717",
    appId: "1:970634827717:web:ee2bc9ae881dc8dd7d6872",
    measurementId: "G-44LGLMB5NF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllChildren() {
    console.log('🗑️  Firestore 아이 정보 삭제 시작...\n');

    try {
        // 모든 users 컬렉션 가져오기
        const usersSnapshot = await getDocs(collection(db, 'users'));

        let totalDeleted = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            console.log(`\n👤 사용자: ${userId}`);

            // 각 사용자의 children 서브컬렉션 가져오기
            const childrenSnapshot = await getDocs(collection(db, 'users', userId, 'children'));

            if (childrenSnapshot.empty) {
                console.log('  ➡️  아이 정보 없음');
                continue;
            }

            // 각 아이 정보 삭제
            for (const childDoc of childrenSnapshot.docs) {
                const childId = childDoc.id;
                const childData = childDoc.data();

                console.log(`  🗑️  삭제: ${childData.name || '이름없음'} (ID: ${childId})`);

                // 아이 문서 삭제
                await deleteDoc(doc(db, 'users', userId, 'children', childId));
                totalDeleted++;

                // 각 아이의 서브컬렉션도 확인하고 삭제
                try {
                    // status/checklist 삭제
                    await deleteDoc(doc(db, 'users', userId, 'children', childId, 'status', 'checklist'));
                    console.log(`    ✓ 체크리스트 삭제`);
                } catch (e) {
                    // 없으면 무시
                }

                try {
                    // status/vaccination 삭제
                    await deleteDoc(doc(db, 'users', userId, 'children', childId, 'status', 'vaccination'));
                    console.log(`    ✓ 예방접종 삭제`);
                } catch (e) {
                    // 없으면 무시
                }

                try {
                    // health/records 삭제
                    await deleteDoc(doc(db, 'users', userId, 'children', childId, 'health', 'records'));
                    console.log(`    ✓ 건강기록 삭제`);
                } catch (e) {
                    // 없으면 무시
                }
            }

            // 사용자의 logs 삭제
            const logsSnapshot = await getDocs(collection(db, 'users', userId, 'logs'));
            for (const logDoc of logsSnapshot.docs) {
                await deleteDoc(doc(db, 'users', userId, 'logs', logDoc.id));
            }
            if (!logsSnapshot.empty) {
                console.log(`  ✓ 관찰일기 ${logsSnapshot.size}개 삭제`);
            }

            // 사용자의 growth 삭제
            const growthSnapshot = await getDocs(collection(db, 'users', userId, 'growth'));
            for (const growthDoc of growthSnapshot.docs) {
                await deleteDoc(doc(db, 'users', userId, 'growth', growthDoc.id));
            }
            if (!growthSnapshot.empty) {
                console.log(`  ✓ 성장기록 ${growthSnapshot.size}개 삭제`);
            }
        }

        // Family Groups 삭제
        console.log('\n👨‍👩‍👧‍👦 가족 그룹 삭제...');
        const familyGroupsSnapshot = await getDocs(collection(db, 'familyGroups'));
        for (const groupDoc of familyGroupsSnapshot.docs) {
            await deleteDoc(doc(db, 'familyGroups', groupDoc.id));
            console.log(`  🗑️  삭제: ${groupDoc.id}`);
        }

        console.log(`\n✅ 완료! 총 ${totalDeleted}개의 아이 정보가 삭제되었습니다.`);
        console.log('⚠️  사용자 계정 정보는 유지되었습니다.\n');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    }
}

// 확인 후 실행
console.log('⚠️  경고: 이 스크립트는 Firestore의 모든 아이 정보를 삭제합니다!');
console.log('⚠️  사용자 계정은 유지되지만, 아이 정보, 관찰일기, 성장기록 등은 모두 삭제됩니다.\n');
console.log('3초 후 삭제를 시작합니다...\n');

setTimeout(() => {
    deleteAllChildren();
}, 3000);
