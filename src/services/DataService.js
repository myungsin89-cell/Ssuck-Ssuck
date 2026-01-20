import FirestoreService from './FirestoreService';

const STORAGE_KEYS = {
    LOGS: 'ssukdiary_logs',
    CHECKLIST: 'ssukdiary_checklist',
    CHILDREN: 'ssukdiary_children',
    SELECTED_CHILD_ID: 'ssukdiary_selected_child_id',
    USER_INFO: 'ssukdiary_user_info',
    GROWTH: 'ssukdiary_growth',
    VACCINATION: 'ssukdiary_vaccination',
    FAMILY_GROUPS: 'ssukdiary_family_groups',
    CURRENT_USER: 'ssukdiary_current_user',
    USERS: 'ssukdiary_users',
    USER_CHILDREN: 'ssukdiary_user_children',  // 사용자별 아이 ID 목록
    HEALTH_RECORDS: 'ssukdiary_health_records'  // 건강 기록 (알레르기, 입원, 질병 이력 등)
};

class DataService {
    // --- User & Children Management ---

    // 사용자가 접근 가능한 아이 ID 목록 가져오기
    getUserChildren(userId) {
        const currentUser = userId || this.getCurrentUser()?.userId;
        if (!currentUser) return [];

        // 1. 사용자가 직접 등록한 아이 매핑 가져오기
        const userChildrenMap = this.getUserChildrenMap();
        let directChildrenIds = userChildrenMap[currentUser] || [];

        // 2. 가족 그룹을 통해 접근 가능한 아이
        const sharedChildrenIds = this.getSharedChildren(currentUser);

        // 3. 데이터 유효성 검사 및 자동 복구
        // 매핑된 ID들이 실제로 존재하는지 확인합니다.
        const allChildren = this.getAllChildrenMap();

        // 실제 존재하는 아이 ID만 필터링
        const validDirectChildren = directChildrenIds.filter(id => allChildren[id]);
        const validSharedChildren = sharedChildrenIds.filter(id => allChildren[id]);

        // 필터링만 수행


        // 중복 제거 및 반환
        const result = [...new Set([...directChildrenIds, ...sharedChildrenIds])];
        return result; // 필터링 전의 ID를 반환하되(매핑 유지), 실제 객체 변환 시 필터링됨
    }

    // 사용자-아이 연결 맵 가져오기
    getUserChildrenMap() {
        const data = localStorage.getItem(STORAGE_KEYS.USER_CHILDREN);
        return data ? JSON.parse(data) : {};
    }

    // 가족 그룹을 통해 공유된 아이 ID 목록
    getSharedChildren(userId) {
        const allGroups = this.getAllFamilyGroups();
        const sharedChildIds = [];

        Object.values(allGroups).forEach(group => {
            const isMember = group.members.some(m => String(m.userId) === String(userId));
            if (isMember && group.childId) {
                sharedChildIds.push(String(group.childId));
            }
        });

        return sharedChildIds;
    }

    // 모든 아이 정보 가져오기 (맵 구조)
    getAllChildrenMap() {
        const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
        if (!data) return {};

        const parsed = JSON.parse(data);
        // 배열이면 맵으로 변환 (마이그레이션)
        if (Array.isArray(parsed)) {
            const map = {};
            parsed.forEach(child => {
                map[child.id] = child;
            });
            localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(map));
            return map;
        }
        return parsed;
    }

    // 아이 정보 저장 (사용자 연결 포함)
    async saveChildInfo(childInfo, userId) {
        const currentUser = userId || this.getCurrentUser()?.userId;
        if (!currentUser) {
            console.error('No user logged in');
            return;
        }

        // 1. 아이 정보 저장
        const allChildren = this.getAllChildrenMap();
        allChildren[childInfo.id] = childInfo;
        localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(allChildren));

        // 2. 사용자-아이 연결 저장
        const userChildren = this.getUserChildrenMap();
        if (!userChildren[currentUser]) {
            userChildren[currentUser] = [];
        }
        if (!userChildren[currentUser].includes(String(childInfo.id))) {
            userChildren[currentUser].push(String(childInfo.id));
        }
        localStorage.setItem(STORAGE_KEYS.USER_CHILDREN, JSON.stringify(userChildren));

        // Firestore에 사용자-아이 연결 저장
        FirestoreService.saveUserChildren(currentUser, userChildren[currentUser]).catch(err => console.error('Cloud user-children mapping save failed:', err));

        // 3. 선택된 아이로 설정
        localStorage.setItem(STORAGE_KEYS.SELECTED_CHILD_ID, String(childInfo.id));

        // Firestore 동기화
        FirestoreService.saveChild(childInfo).catch(err => console.error('Cloud save failed:', err));
    }

    // 선택된 아이 ID 가져오기
    getSelectedChildId() {
        const id = localStorage.getItem(STORAGE_KEYS.SELECTED_CHILD_ID);
        // "null" 문자열이 저장된 경우에 대한 방어
        if (id === 'null' || id === 'undefined') return null;
        return id ? Number(id) : null;
    }

    // 선택된 아이 ID 설정
    setSelectedChildId(id) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CHILD_ID, String(id));
    }

    // 아이 정보 가져오기 (권한 확인)
    getChildInfo(childId, userId) {
        const currentUser = userId || this.getCurrentUser()?.userId;

        // childId가 없으면 선택된 아이 반환
        if (!childId) {
            const selectedId = this.getSelectedChildId();
            if (!selectedId) return null;
            childId = selectedId;
        }

        // 권한 확인
        if (currentUser) {
            const accessibleChildren = this.getUserChildren(currentUser);
            if (!accessibleChildren.includes(String(childId))) {
                console.warn('User does not have access to this child');
                return null;
            }
        }

        const allChildren = this.getAllChildrenMap();
        return allChildren[childId] || null;
    }

    // 사용자가 접근 가능한 모든 아이 정보 가져오기
    getChildren(userId) {
        const currentUser = userId || this.getCurrentUser()?.userId;
        if (!currentUser) {
            console.warn('DataService: No current user for getChildren');
            return [];
        }

        const accessibleChildIds = this.getUserChildren(currentUser);
        const allChildren = this.getAllChildrenMap();

        const result = accessibleChildIds.map(id => allChildren[id]).filter(Boolean);
        console.log(`DataService: getChildren found ${result.length} children for user ${currentUser}`);
        return result;
    }

    // --- Sync Helper ---
    async syncFromServer() {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return null;

            const uid = currentUser.userId;

            // 0. 가족 그룹 정보 동기화
            const familyGroups = await FirestoreService.getFamilyGroupsByUserId(uid);
            if (familyGroups && familyGroups.length > 0) {
                const allGroups = this.getAllFamilyGroups();
                familyGroups.forEach(group => {
                    allGroups[group.familyGroupId] = group;
                });
                localStorage.setItem(STORAGE_KEYS.FAMILY_GROUPS, JSON.stringify(allGroups));
            }

            // 1. 아이 정보 (Children) - 직접 등록한 아이 + 공유받은 아이
            const myChildren = await FirestoreService.getChildren();
            const sharedChildren = await FirestoreService.getSharedChildren(uid);

            // 중복 제거하여 병합
            const allChildrenArray = [...myChildren, ...sharedChildren];
            const uniqueChildren = Array.from(
                new Map(allChildrenArray.map(child => [child.id, child])).values()
            );

            if (uniqueChildren.length > 0) {
                const currentMap = this.getAllChildrenMap();
                uniqueChildren.forEach(child => {
                    currentMap[child.id] = child;
                });
                localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(currentMap));

                // [CRITICAL] 내 아이 목록(USER_CHILDREN) 동기화
                const userChildren = this.getUserChildrenMap();
                userChildren[uid] = uniqueChildren.map(c => String(c.id));
                localStorage.setItem(STORAGE_KEYS.USER_CHILDREN, JSON.stringify(userChildren));
            }

            // 2. 관찰 일기 (Logs) - 병합 방식으로 변경
            const serverLogs = await FirestoreService.getLogs();
            const localLogsData = localStorage.getItem(STORAGE_KEYS.LOGS);
            const localLogs = localLogsData ? JSON.parse(localLogsData) : [];

            // 서버와 로컬 데이터 병합 (ID 기준으로 중복 제거, 서버 데이터 우선)
            const mergedLogs = [...serverLogs];
            localLogs.forEach(localLog => {
                if (!mergedLogs.some(log => String(log.id) === String(localLog.id))) {
                    mergedLogs.push(localLog);
                }
            });

            if (mergedLogs.length > 0) {
                // 최신순 정렬
                mergedLogs.sort((a, b) => b.id - a.id);
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(mergedLogs));
            }

            // 3. 성장 기록 (Growth) - 병합 방식으로 변경
            const serverGrowth = await FirestoreService.getAllGrowthData();
            const localGrowthData = localStorage.getItem(STORAGE_KEYS.GROWTH);
            const localGrowth = localGrowthData ? JSON.parse(localGrowthData) : [];

            // 서버와 로컬 데이터 병합
            const mergedGrowth = [...serverGrowth];
            localGrowth.forEach(localEntry => {
                if (!mergedGrowth.some(entry => String(entry.id) === String(localEntry.id))) {
                    mergedGrowth.push(localEntry);
                }
            });

            if (mergedGrowth.length > 0) {
                localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(mergedGrowth));
            }

            // 4. 예방접종 및 건강 기록 (선택된 아이 중심) - 병합 방식
            const selectedId = this.getSelectedChildId();
            if (selectedId) {
                const serverChecklist = await FirestoreService.getChecklist(selectedId);
                const serverVaccination = await FirestoreService.getVaccinationRecords(selectedId);
                const serverHealth = await FirestoreService.getHealthRecords(selectedId);

                // 체크리스트 병합
                const allChecklists = this.getAllChecklists();
                const localChecklist = allChecklists[selectedId] || {};
                allChecklists[selectedId] = { ...localChecklist, ...serverChecklist };
                localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(allChecklists));

                // 예방접종 병합
                const allVaccinations = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINATION) || '{}');
                const localVaccination = allVaccinations[selectedId] || {};
                allVaccinations[selectedId] = { ...localVaccination, ...serverVaccination };
                localStorage.setItem(STORAGE_KEYS.VACCINATION, JSON.stringify(allVaccinations));

                // 건강 기록 병합
                const allHealth = JSON.parse(localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS) || '{}');
                const localHealthRecords = allHealth[selectedId] || [];
                const mergedHealth = [...serverHealth];
                localHealthRecords.forEach(localRecord => {
                    if (!mergedHealth.some(record => String(record.id) === String(localRecord.id))) {
                        mergedHealth.push(localRecord);
                    }
                });
                allHealth[selectedId] = mergedHealth;
                localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(allHealth));
            }

            return { children: uniqueChildren, logs };
        } catch (error) {
            console.error('Server sync failed:', error);
            return null;
        }
    }

    // --- Logs ---
    getLogs(childId) {
        const data = localStorage.getItem(STORAGE_KEYS.LOGS);
        const allLogs = data ? JSON.parse(data) : [];
        const sid = childId || this.getSelectedChildId();
        if (!sid) return allLogs;
        return allLogs.filter(log => String(log.childId) === String(sid));
    }

    async saveLog(logEntry) {
        const selectedId = this.getSelectedChildId();
        if (!selectedId) return [];

        const status = localStorage.getItem(STORAGE_KEYS.LOGS);
        const allLogs = status ? JSON.parse(status) : [];

        const children = this.getChildren();
        const currentChild = children.find(c => c.id === selectedId);

        const ageAtRecord = this.calculateAgeAtRecord(currentChild.birthDate);

        const newLog = {
            ...logEntry,
            id: Date.now(),
            childId: selectedId,
            createdAt: new Date().toISOString(),
            ageAtRecord
        };

        const newAllLogs = [newLog, ...allLogs];
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(newAllLogs));

        // Firestore sync
        FirestoreService.saveLog(newLog).catch(err => console.error('Cloud save failed:', err));

        return this.getLogs(selectedId);
    }

    calculateAgeAtRecord(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);

        const diffTime = today - birth;
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let months = (today.getFullYear() - birth.getFullYear()) * 12;
        months -= birth.getMonth();
        months += today.getMonth();

        if (today.getDate() < birth.getDate()) {
            months--;
        }

        const lastMonthDate = new Date(today.getFullYear(), today.getMonth(), birth.getDate());
        if (lastMonthDate > today) {
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        }
        const days = Math.floor((today - lastMonthDate) / (1000 * 60 * 60 * 24));

        return {
            months: months < 0 ? 0 : months,
            days: days < 0 ? 0 : days,
            totalDays: totalDays < 0 ? 0 : totalDays,
            label: `${months < 0 ? 0 : months}개월 ${days < 0 ? 0 : days}일`
        };
    }

    async deleteLog(id, childId) {
        console.log('🗑️ deleteLog 호출됨:', { id, childId });
        const data = localStorage.getItem(STORAGE_KEYS.LOGS);
        const allLogs = data ? JSON.parse(data) : [];
        console.log('📋 전체 로그 개수:', allLogs.length);
        console.log('🔍 삭제할 ID:', id, '타입:', typeof id);

        // ID가 존재하고, 문자열로 변환했을 때 일치하지 않는 것만 남김 (삭제 처리)
        const newAllLogs = allLogs.filter(log => {
            const match = log.id && String(log.id) !== String(id);
            if (!match) {
                console.log('✅ 삭제될 로그 발견:', log.id, '내용:', log.text?.substring(0, 20));
            }
            return match;
        });
        console.log('📋 삭제 후 로그 개수:', newAllLogs.length);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(newAllLogs));

        FirestoreService.deleteLog(id).catch(err => console.error('Cloud delete failed:', err));

        // 삭제 후 현재 아이의 로그를 다시 가져오는데, 명시적으로 새로운 배열이 반환되도록 함
        const result = [...this.getLogs(childId)];
        console.log('✨ 반환될 로그 개수:', result.length);
        return result;
    }

    // --- Checklist ---
    getAllChecklists() {
        const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
        return data ? JSON.parse(data) : {};
    }

    getCheckedItems(childId) {
        const sid = childId || this.getSelectedChildId();
        if (!sid) return {};
        const all = this.getAllChecklists();
        return all[sid] || {};
    }

    async toggleChecklist(itemId, isChecked) {
        const selectedId = this.getSelectedChildId();
        if (!selectedId) return {};

        const all = this.getAllChecklists();
        if (!all[selectedId]) all[selectedId] = {};

        all[selectedId][itemId] = isChecked;
        localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(all));

        FirestoreService.saveChecklist(selectedId, all[selectedId]).catch(err => console.error('Cloud checklist save failed:', err));

        return all[selectedId];
    }

    // --- Auth ---
    isLoggedIn() {
        const data = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        return data ? JSON.parse(data).isLoggedIn : false;
    }

    async setLoggedIn(userInfo) {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({
            ...userInfo,
            isLoggedIn: true
        }));
        await this.syncFromServer();
    }


    // --- Growth ---
    getGrowthHistory(childId) {
        const data = localStorage.getItem(STORAGE_KEYS.GROWTH);
        let allHistory = [];

        if (data) {
            try {
                const parsed = JSON.parse(data);
                // 데이터가 배열인지 확인하고, 아니면 빈 배열로 초기화
                if (Array.isArray(parsed)) {
                    allHistory = parsed;
                } else {
                    // 객체 형식이면 배열로 변환 시도 후 저장
                    console.warn('Growth data was not an array, resetting to empty array');
                    localStorage.setItem(STORAGE_KEYS.GROWTH, '[]');
                    allHistory = [];
                }
            } catch (e) {
                console.error('Error parsing growth data:', e);
                localStorage.setItem(STORAGE_KEYS.GROWTH, '[]');
                allHistory = [];
            }
        }

        const sid = childId || this.getSelectedChildId();
        if (!sid) return [];
        return allHistory.filter(h => String(h.childId) === String(sid));
    }

    async saveGrowthEntry(entry) {
        const history = this.getGrowthHistory();
        const selectedId = this.getSelectedChildId();

        const newEntry = {
            ...entry,
            id: Date.now(),
            childId: selectedId,
            createdAt: new Date().toISOString()
        };

        const allData = localStorage.getItem(STORAGE_KEYS.GROWTH);
        const allHistory = allData ? JSON.parse(allData) : [];
        const newAllHistory = [...allHistory, newEntry];

        localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(newAllHistory));

        // Firestore sync
        FirestoreService.saveGrowthEntry(newEntry).catch(err => console.error('Cloud growth save failed:', err));

        return this.getGrowthHistory();
    }
    async deleteGrowthEntry(id, childId) {
        console.log('🗑️ deleteGrowthEntry 호출됨:', { id, childId });
        const data = localStorage.getItem(STORAGE_KEYS.GROWTH);
        const allHistory = data ? JSON.parse(data) : [];
        console.log('📊 전체 성장 기록 개수:', allHistory.length);
        console.log('🔍 삭제할 ID:', id, '타입:', typeof id);

        const newAllHistory = allHistory.filter(h => {
            const match = h.id && String(h.id) !== String(id);
            if (!match) {
                console.log('✅ 삭제될 성장 기록 발견:', h.id, h.months + '개월');
            }
            return match;
        });
        console.log('📊 삭제 후 성장 기록 개수:', newAllHistory.length);
        localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(newAllHistory));

        FirestoreService.deleteGrowthEntry(id).catch(err => console.error('Cloud growth delete failed:', err));

        const result = [...this.getGrowthHistory(childId)];
        console.log('✨ 반환될 성장 기록 개수:', result.length);
        return result;
    }
    // --- Vaccination ---
    getVaccinationRecords(childId) {
        const data = localStorage.getItem(STORAGE_KEYS.VACCINATION);
        const allRecords = data ? JSON.parse(data) : {};
        const sid = childId || this.getSelectedChildId();
        return allRecords[sid] || {};
    }

    async toggleVaccination(childId, vaccineId, dose, isCompleted, completedDate) {
        const sid = childId || this.getSelectedChildId();
        if (!sid) return {};

        const data = localStorage.getItem(STORAGE_KEYS.VACCINATION);
        const allRecords = data ? JSON.parse(data) : {};

        if (!allRecords[sid]) allRecords[sid] = {};

        const key = `${vaccineId}_${dose}`;
        allRecords[sid][key] = {
            completed: isCompleted,
            completedDate: completedDate,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.VACCINATION, JSON.stringify(allRecords));

        //Firestore sync
        FirestoreService.saveVaccinationRecords(sid, allRecords[sid]).catch(err => console.error('Cloud vaccination save failed:', err));

        return allRecords[sid];
    }
    // --- Family Groups ---
    generateInviteCode() {
        // 6자리 랜덤 코드 생성 (대문자 + 숫자)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 가능한 문자 제외 (I, O, 0, 1)
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createFamilyGroup(childId, userId, userName) {
        const familyGroupId = `fg_${Date.now()}`;
        const inviteCode = this.generateInviteCode();

        const familyGroup = {
            familyGroupId,
            childId,
            inviteCode,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            members: [
                {
                    userId,
                    name: userName,
                    role: 'owner',
                    joinedAt: new Date().toISOString()
                }
            ]
        };

        // LocalStorage에 저장
        const allGroups = this.getAllFamilyGroups();
        allGroups[familyGroupId] = familyGroup;
        localStorage.setItem(STORAGE_KEYS.FAMILY_GROUPS, JSON.stringify(allGroups));

        // Firestore에 저장
        FirestoreService.saveFamilyGroup(familyGroup).catch(err => console.error('Cloud family group save failed:', err));

        return familyGroup;
    }

    getAllFamilyGroups() {
        const data = localStorage.getItem(STORAGE_KEYS.FAMILY_GROUPS);
        return data ? JSON.parse(data) : {};
    }

    // 초대 코드로 그룹 찾기
    findFamilyGroupByInviteCode(inviteCode) {
        const allGroups = this.getAllFamilyGroups();
        return Object.values(allGroups).find(group => group.inviteCode === inviteCode.toUpperCase());
    }

    // 아이 ID로 그룹 찾기
    getFamilyGroupByChildId(childId) {
        const allGroups = this.getAllFamilyGroups();
        return Object.values(allGroups).find(group => String(group.childId) === String(childId));
    }

    // 그룹 가입하기
    async joinFamilyGroup(inviteCode, userId, userName) {
        try {
            // 1. 로컬에서 먼저 검색
            let familyGroup = this.findFamilyGroupByInviteCode(inviteCode);

            // 2. 로컬에 없으면 Firestore에서 검색
            if (!familyGroup) {
                console.log('Local search failed, searching Firestore for invite code:', inviteCode);
                familyGroup = await FirestoreService.getFamilyGroupByInviteCode(inviteCode);

                if (familyGroup) {
                    console.log('Found family group in Firestore:', familyGroup.familyGroupId);
                    // Firestore에서 찾은 그룹을 로컬에 저장
                    const allGroups = this.getAllFamilyGroups();
                    allGroups[familyGroup.familyGroupId] = familyGroup;
                    localStorage.setItem(STORAGE_KEYS.FAMILY_GROUPS, JSON.stringify(allGroups));
                }
            }

            if (!familyGroup) {
                return {
                    success: false,
                    message: '유효하지 않은 초대 코드입니다.'
                };
            }

            // 3. 이미 멤버인지 확인
            const isMember = familyGroup.members.some(m => String(m.userId) === String(userId));

            if (isMember) {
                // 이미 멤버인 경우 - 강제로 동기화하여 아이 정보 복구
                const userChildren = this.getUserChildrenMap();
                if (!userChildren[userId]) {
                    userChildren[userId] = [];
                }

                // 아이 ID가 없으면 추가
                if (!userChildren[userId].includes(String(familyGroup.childId))) {
                    userChildren[userId].push(String(familyGroup.childId));
                    localStorage.setItem(STORAGE_KEYS.USER_CHILDREN, JSON.stringify(userChildren));
                    await FirestoreService.saveUserChildren(userId, userChildren[userId]);
                }

                // 항상 서버에서 최신 데이터 동기화
                await this.syncFromServer();

                return {
                    success: true,
                    message: '가족 그룹에 다시 연결되었습니다! 🎉',
                    familyGroup
                };
            }

            // 4. 멤버 추가
            familyGroup.members.push({
                userId,
                name: userName,
                role: 'member',
                joinedAt: new Date().toISOString()
            });

            const allGroups = this.getAllFamilyGroups();
            allGroups[familyGroup.familyGroupId] = familyGroup;
            localStorage.setItem(STORAGE_KEYS.FAMILY_GROUPS, JSON.stringify(allGroups));

            // Firestore 동기화
            await FirestoreService.saveFamilyGroup(familyGroup);

            // 5. 사용자-아이 연결 추가
            const userChildren = this.getUserChildrenMap();
            if (!userChildren[userId]) {
                userChildren[userId] = [];
            }
            if (!userChildren[userId].includes(String(familyGroup.childId))) {
                userChildren[userId].push(String(familyGroup.childId));
                localStorage.setItem(STORAGE_KEYS.USER_CHILDREN, JSON.stringify(userChildren));

                // Firestore에 사용자-아이 연결 저장
                await FirestoreService.saveUserChildren(userId, userChildren[userId]);
            }

            // 6. 아이 정보 동기화
            await this.syncFromServer();

            const ownerName = familyGroup.members.find(m => m.role === 'owner')?.name || '가족';

            return {
                success: true,
                message: `${ownerName}님의 가족 그룹에 합류했습니다! 🎉`,
                familyGroup
            };
        } catch (error) {
            console.error('joinFamilyGroup error:', error);
            return {
                success: false,
                message: '초대 코드 처리 중 오류가 발생했습니다.'
            };
        }
    }

    getCurrentUser() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    }

    async setCurrentUser(userId, userName) {
        if (!userId) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            return;
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ userId, name: userName }));

        // 로그인 시 클라우드에서 데이터 가져오기
        await this.syncFromServer();
    }

    // --- User Authentication ---
    async registerUser(userId, password, name) {
        // 1. Firestore에 먼저 등록 시도 (중복 확인)
        const firestoreResult = await FirestoreService.registerUser(userId, password, name);

        if (!firestoreResult.success) {
            if (firestoreResult.error === 'USER_EXISTS') {
                return false; // 이미 존재하는 아이디
            }
            // Firestore 오류 시에도 로컬에는 저장
            console.warn('Firestore registration failed, saving locally only');
        }

        // 2. 로컬 저장소에도 저장 (오프라인 대응)
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        const users = data ? JSON.parse(data) : {};

        // 이미 존재하는 아이디인지 확인 (로컬)
        if (users[userId]) {
            return false;
        }

        // 새 사용자 등록
        users[userId] = {
            userId,
            password, // 실제 프로덕션에서는 해시화 필요
            name,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    }

    async authenticateUser(userId, password) {
        // 1. Firestore에서 먼저 확인 (클라우드 우선)
        try {
            const firestoreUser = await FirestoreService.authenticateUser(userId, password);

            if (firestoreUser) {
                // Firestore 인증 성공 → 로컬에도 동기화
                const data = localStorage.getItem(STORAGE_KEYS.USERS);
                const users = data ? JSON.parse(data) : {};
                users[userId] = {
                    userId: firestoreUser.userId,
                    password,
                    name: firestoreUser.name,
                    createdAt: firestoreUser.createdAt
                };
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
                return firestoreUser;
            }
        } catch (error) {
            console.warn('Firestore authentication failed, trying localStorage:', error);
        }

        // 2. Firestore 실패 시 로컬 저장소에서 확인 (오프라인 대응)
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        const users = data ? JSON.parse(data) : {};

        const user = users[userId];

        if (!user || user.password !== password) {
            return null;
        }

        return user;
    }

    // --- Delete Child ---
    deleteChild(childId, userId) {
        try {
            const currentUser = userId || this.getCurrentUser()?.userId;
            if (!currentUser) {
                console.error('No user logged in');
                return false;
            }

            console.log('Deleting child:', childId, 'by user:', currentUser);

            // 아이가 실제로 존재하는지 확인
            const allChildren = this.getAllChildrenMap();
            let childExists = true;
            if (!allChildren[childId]) {
                console.warn('Child info not found in map, but proceeding to remove links:', childId);
                childExists = false;
            }

            // 1. 아이 정보 삭제 (존재할 경우)
            if (childExists) {
                delete allChildren[childId];
                localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(allChildren));

                // [FIXED] Firestore에서도 삭제 (가장 중요)
                FirestoreService.deleteChild(childId).catch(err => console.error('Cloud delete failed:', err));
            }

            // 2. 사용자-아이 연결 삭제
            const userChildren = this.getUserChildrenMap();
            if (userChildren[currentUser]) {
                userChildren[currentUser] = userChildren[currentUser].filter(id => String(id) !== String(childId));
                localStorage.setItem(STORAGE_KEYS.USER_CHILDREN, JSON.stringify(userChildren));
            }

            // 3. 관찰 일기 삭제
            const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
            const filteredLogs = allLogs.filter(log => String(log.childId) !== String(childId));
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filteredLogs));

            // 4. 성장 기록 삭제
            const allGrowth = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROWTH) || '[]');
            const filteredGrowth = allGrowth.filter(g => String(g.childId) !== String(childId));
            localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(filteredGrowth));

            // 5. 예방접종 기록 삭제
            const allVaccination = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINATION) || '{ }');
            delete allVaccination[childId];
            localStorage.setItem(STORAGE_KEYS.VACCINATION, JSON.stringify(allVaccination));

            // 6. 체크리스트 삭제
            const allChecklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '{ }');
            delete allChecklist[childId];
            localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(allChecklist));

            // 7. 가족 그룹 삭제
            const allGroups = this.getAllFamilyGroups();
            const groupToDelete = Object.values(allGroups).find(g => String(g.childId) === String(childId));
            if (groupToDelete) {
                delete allGroups[groupToDelete.familyGroupId];
                localStorage.setItem(STORAGE_KEYS.FAMILY_GROUPS, JSON.stringify(allGroups));
            }

            // 8. 건강 기록 삭제 (알레르기, 질병 이력, 영양제 등)
            const allHealthRecords = JSON.parse(localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS) || '{ }');
            delete allHealthRecords[childId];
            localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(allHealthRecords));

            // 9. 선택된 아이 ID가 삭제된 아이면 초기화
            const selectedId = this.getSelectedChildId();
            if (String(selectedId) === String(childId)) {
                localStorage.removeItem(STORAGE_KEYS.SELECTED_CHILD_ID);
            }

            console.log(`Child ${childId} deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting child:', error);
            return false;
        }
    }

    // --- Health Records (건강 기록) ---

    // 건강 기록 가져오기
    getHealthRecords(childId) {
        const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
        const allRecords = data ? JSON.parse(data) : {};
        return allRecords[childId] || [];
    }

    // 건강 기록 추가
    addHealthRecord(childId, record) {
        const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
        const allRecords = data ? JSON.parse(data) : {};

        if (!allRecords[childId]) {
            allRecords[childId] = [];
        }

        const newRecord = {
            ...record,
            id: `hr_${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        allRecords[childId].push(newRecord);
        localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(allRecords));

        // Firestore 동기화
        FirestoreService.saveHealthRecords(childId, allRecords[childId]).catch(err => console.error('Cloud health records save failed:', err));

        return newRecord;
    }

    // 건강 기록 수정
    updateHealthRecord(childId, recordId, updates) {
        const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
        const allRecords = data ? JSON.parse(data) : {};

        if (!allRecords[childId]) return null;

        const index = allRecords[childId].findIndex(r => r.id === recordId);
        if (index === -1) return null;

        allRecords[childId][index] = {
            ...allRecords[childId][index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(allRecords));
        return allRecords[childId][index];
    }

    // 건강 기록 삭제
    deleteHealthRecord(childId, recordId) {
        const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
        const allRecords = data ? JSON.parse(data) : {};

        if (!allRecords[childId]) return false;

        allRecords[childId] = allRecords[childId].filter(r => r.id !== recordId);
        localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(allRecords));

        return true;
    }

    // 카테고리별 건강 기록 가져오기
    getHealthRecordsByCategory(childId, category) {
        const records = this.getHealthRecords(childId);
        return records.filter(r => r.category === category);
    }

    // 알레르기 목록 가져오기
    getAllergies(childId) {
        return this.getHealthRecordsByCategory(childId, 'allergy');
    }

    // 입원 기록 가져오기
    getHospitalizations(childId) {
        return this.getHealthRecordsByCategory(childId, 'hospitalization');
    }

    // 질병 이력 가져오기
    getIllnesses(childId) {
        return this.getHealthRecordsByCategory(childId, 'illness');
    }
}

export default new DataService();
