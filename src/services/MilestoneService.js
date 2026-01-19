import milestonesData from '../data/milestones_ko.json';

class MilestoneService {
    constructor() {
        this.milestones = milestonesData.milestones;
    }

    // 모든 마일스톤 데이터 가져오기 (Simulate async)
    async getAllMilestones() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.milestones);
            }, 100);
        });
    }

    // 특정 월령의 마일스톤 가져오기 (개월수 기준 자동 매칭)
    async getMilestonesByAge(ageMonths) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 사용 가능한 월령 리스트 추출
                const availableAges = this.milestones.map(m => parseInt(m.id));

                // 현재 개월수보다 작거나 같은 월령 중 가장 큰 것 찾기 (예: 8개월 -> 6개월 선택)
                const targetAge = availableAges
                    .filter(age => age <= ageMonths)
                    .sort((a, b) => b - a)[0] || availableAges[0];

                const data = this.milestones.find(m => parseInt(m.id) === targetAge);
                resolve(data);
            }, 100);
        });
    }

    // 아이의 생일로 현재 월령(개월 수) 계산
    calculateAgeInMonths(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);

        let months = (today.getFullYear() - birth.getFullYear()) * 12;
        months -= birth.getMonth();
        months += today.getMonth();

        // 날짜가 아직 안 지났으면 1개월 차감
        if (today.getDate() < birth.getDate()) {
            months--;
        }

        return months < 0 ? 0 : months;
    }

    // 마일스톤 범위 계산 (예: 18개월 마일스톤이 언제까지 유효한지)
    async getMilestoneRange(currentAgeMonths) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const availableAges = this.milestones.map(m => parseInt(m.id)).sort((a, b) => a - b);

                // 현재 월령보다 작거나 같은 가장 큰 월령 (현재 적용된 단계)
                const currentMilestoneAge = availableAges
                    .filter(age => age <= currentAgeMonths)
                    .sort((a, b) => b - a)[0] || availableAges[0];

                // 다음 단계 월령 찾기
                const currentIndex = availableAges.indexOf(currentMilestoneAge);
                const nextMilestoneAge = availableAges[currentIndex + 1];

                // 범위 끝 계산 (다음 단계 시작 전 - 1개월)
                const rangeEnd = nextMilestoneAge ? nextMilestoneAge - 1 : currentMilestoneAge + 5;

                resolve({
                    currentMilestoneAge,
                    nextMilestoneAge,
                    rangeEnd
                });
            }, 50);
        });
    }

    // 텍스트 분석 및 관련 마일스톤 찾기
    analyzeLog(text, currentAgeMonths = null) {
        if (!text || text.length < 2) return [];

        let matches = [];

        this.milestones.forEach(ageGroup => {
            const groupAge = parseInt(ageGroup.id);
            if (ageGroup.categories) {
                ageGroup.categories.forEach(category => {
                    category.items.forEach(item => {
                        if (item.keywords) {
                            const hasKeyword = item.keywords.some(keyword => text.includes(keyword));
                            if (hasKeyword) {
                                matches.push({
                                    ageLabel: ageGroup.age_label,
                                    ageMonths: groupAge,
                                    categoryId: category.id,
                                    categoryLabel: category.label,
                                    milestone: item.text,
                                    id: item.id
                                });
                            }
                        }
                    });
                });
            }
        });

        // 현재 월령이 제공된 경우, 현재 월령과 가까운 항목 순으로 정렬
        if (currentAgeMonths !== null) {
            matches.sort((a, b) => {
                const diffA = Math.abs(a.ageMonths - currentAgeMonths);
                const diffB = Math.abs(b.ageMonths - currentAgeMonths);
                return diffA - diffB;
            });
        } else {
            // 기본 정렬: 월령 순
            matches.sort((a, b) => a.ageMonths - b.ageMonths);
        }

        // 중복 제거 (동일한 마일스톤 ID가 여러 키워드에 의해 매칭될 수 있음)
        const uniqueMatches = [];
        const seenIds = new Set();
        for (const match of matches) {
            if (!seenIds.has(match.id)) {
                seenIds.add(match.id);
                uniqueMatches.push(match);
            }
        }

        return uniqueMatches;
    }

    // AI 분석을 위해 특정 범위의 마일스톤만 필터링하여 가져오기
    async getMilestonesByRange(currentAge, range = 6) {
        return new Promise((resolve) => {
            const filtered = this.milestones.filter(m => {
                const age = parseInt(m.id);
                return age >= currentAge - range && age <= currentAge + range;
            });
            // 만약 현재 연령 매칭이 너무 적으면 범위를 넓혀서 최소 3개 월령 확보
            if (filtered.length < 3) {
                resolve(this.milestones.slice(0, 5)); // 초기 데이터라도 반환
            } else {
                resolve(filtered);
            }
        });
    }
}

export default new MilestoneService();
