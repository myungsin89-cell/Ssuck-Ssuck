// 로그를 월령별로 그룹화하는 유틸리티 함수
export const groupLogsByAge = (logs) => {
    const grouped = {};

    logs.forEach(log => {
        if (!log.ageAtRecord) return;

        const monthKey = `${log.ageAtRecord.months}개월`;

        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                monthLabel: monthKey,
                monthNumber: log.ageAtRecord.months,
                logs: []
            };
        }

        grouped[monthKey].logs.push(log);
    });

    // 월령 순서대로 정렬 (최신순)
    const sortedGroups = Object.values(grouped).sort((a, b) => b.monthNumber - a.monthNumber);

    // 각 그룹 내의 로그도 날짜순 정렬 (최신순)
    sortedGroups.forEach(group => {
        group.logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    return sortedGroups;
};

export default groupLogsByAge;
