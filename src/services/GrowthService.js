// WHO 및 K-DST 기반 간이 표준 성장 데이터
// 실제 앱에서는 더 정밀한 CSV 데이터를 로드하여 사용하지만, 여기서는 핵심 포인트 데이터를 사용한 선형 보간법 활용
const GROWTH_STANDARDS = {
    MALE: {
        HEIGHT: {
            0: { p3: 46.1, p50: 49.9, p97: 53.7 },
            6: { p3: 63.3, p50: 67.6, p97: 71.9 },
            12: { p3: 71.0, p50: 75.7, p97: 80.5 },
            24: { p3: 81.7, p50: 87.1, p97: 92.5 },
            36: { p3: 88.7, p50: 94.9, p97: 101.1 },
            48: { p3: 94.4, p50: 101.6, p97: 108.8 },
            60: { p3: 100.7, p50: 108.8, p97: 116.9 }
        },
        WEIGHT: {
            0: { p3: 2.5, p50: 3.3, p97: 4.3 },
            6: { p3: 6.4, p50: 7.9, p97: 9.8 },
            12: { p3: 7.7, p50: 9.6, p97: 12.0 },
            24: { p3: 9.7, p50: 12.2, p97: 15.3 },
            36: { p3: 11.3, p50: 14.3, p97: 18.3 },
            48: { p3: 12.7, p50: 16.3, p97: 21.2 },
            60: { p3: 14.1, p50: 18.3, p97: 24.2 }
        }
    },
    FEMALE: {
        HEIGHT: {
            0: { p3: 45.4, p50: 49.1, p97: 52.9 },
            6: { p3: 61.2, p50: 65.7, p97: 70.3 },
            12: { p3: 68.9, p50: 74.0, p97: 79.2 },
            24: { p3: 80.0, p50: 85.7, p97: 91.3 },
            36: { p3: 87.4, p50: 93.9, p97: 100.3 },
            48: { p3: 93.5, p50: 100.7, p97: 108.0 },
            60: { p3: 99.9, p50: 107.9, p97: 115.9 }
        },
        WEIGHT: {
            0: { p3: 2.4, p50: 3.2, p97: 4.2 },
            6: { p3: 5.8, p50: 7.3, p97: 9.2 },
            12: { p3: 7.0, p50: 8.9, p97: 11.5 },
            24: { p3: 9.0, p50: 11.5, p97: 14.8 },
            36: { p3: 10.8, p50: 13.9, p97: 18.1 },
            48: { p3: 12.3, p50: 15.5, p97: 20.8 },
            60: { p3: 13.7, p50: 18.2, p97: 24.1 }
        }
    }
};

class GrowthService {
    // 특정 개월수 및 성별에 대한 표준 값 계산 (보간법)
    getStandardValues(gender, months, type) {
        const standard = gender === 'female' ? GROWTH_STANDARDS.FEMALE[type] : GROWTH_STANDARDS.MALE[type];
        const ageKeys = Object.keys(standard).map(Number).sort((a, b) => a - b);

        // 범위 밖 처리
        if (months <= ageKeys[0]) return standard[ageKeys[0]];
        if (months >= ageKeys[ageKeys.length - 1]) return standard[ageKeys[ageKeys.length - 1]];

        // 구간 찾기
        const lowerIdx = ageKeys.findIndex((age, i) => age <= months && ageKeys[i + 1] > months);
        const lowerAge = ageKeys[lowerIdx];
        const upperAge = ageKeys[lowerIdx + 1];

        const lowerVal = standard[lowerAge];
        const upperVal = standard[upperAge];

        const ratio = (months - lowerAge) / (upperAge - lowerAge);

        return {
            p3: lowerVal.p3 + (upperVal.p3 - lowerVal.p3) * ratio,
            p50: lowerVal.p50 + (upperVal.p50 - lowerVal.p50) * ratio,
            p97: lowerVal.p97 + (upperVal.p97 - lowerVal.p97) * ratio
        };
    }

    // 백분위 추정 계산
    calculatePercentile(value, standards) {
        if (value < standards.p3) return '< 3%';
        if (value > standards.p97) return '> 97%';

        if (value <= standards.p50) {
            const p = 3 + (47 * (value - standards.p3) / (standards.p50 - standards.p3));
            return `${Math.round(p)}%`;
        } else {
            const p = 50 + (47 * (value - standards.p50) / (standards.p97 - standards.p50));
            return `${Math.round(p)}%`;
        }
    }
}

export default new GrowthService();
