class ProgressService {
    // 체크리스트 진행률 계산
    calculateProgress(checkedItems, milestones) {
        if (!milestones || !milestones.categories) {
            return {
                total: 0,
                completed: 0,
                percentage: 0,
                byCategory: {}
            };
        }

        // 전체 항목 수 계산
        const totalItems = milestones.categories.reduce(
            (sum, category) => sum + category.items.length,
            0
        );

        // 완료된 항목 수 계산 (현재 마일스톤 범주 내에서만)
        const completedItems = milestones.categories.reduce((sum, category) => {
            return sum + category.items.filter(item => checkedItems[item.id]).length;
        }, 0);

        // 퍼센트 계산
        const percentage = totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : 0;

        // 카테고리별 진행률 계산
        const byCategory = {};
        milestones.categories.forEach(category => {
            const categoryTotal = category.items.length;
            const categoryCompleted = category.items.filter(
                item => checkedItems[item.id]
            ).length;

            byCategory[category.id] = {
                label: category.label,
                total: categoryTotal,
                completed: categoryCompleted,
                percentage: categoryTotal > 0
                    ? Math.round((categoryCompleted / categoryTotal) * 100)
                    : 0
            };
        });

        return {
            total: totalItems,
            completed: completedItems,
            percentage,
            byCategory
        };
    }

    // 진행률 바 색상 결정
    getProgressColor(percentage) {
        if (percentage >= 80) return '#4CAF50'; // 초록색
        if (percentage >= 50) return '#FF9800'; // 주황색
        return '#2196F3'; // 파란색
    }

    // 진행률 텍스트
    getProgressText(completed, total) {
        return `${completed}/${total} 항목 완료`;
    }
}

export default new ProgressService();
