// 브라우저 콘솔에서 실행할 스크립트
// localStorage의 성장 기록 데이터를 배열 형식으로 수정합니다

(function fixGrowthData() {
    console.log('🔧 성장 기록 데이터 수정 시작...');

    const growthData = localStorage.getItem('ssukdiary_growth');
    console.log('현재 저장된 데이터:', growthData);

    if (!growthData) {
        console.log('✅ 성장 기록 데이터가 없습니다. 빈 배열로 초기화합니다.');
        localStorage.setItem('ssukdiary_growth', '[]');
        return;
    }

    try {
        const parsed = JSON.parse(growthData);

        // 이미 배열이면 OK
        if (Array.isArray(parsed)) {
            console.log('✅ 성장 기록 데이터가 이미 배열 형식입니다.');
            return;
        }

        // 객체 형식이면 배열로 변환
        console.log('⚠️ 성장 기록 데이터가 객체 형식입니다. 배열로 변환합니다...');

        // 객체의 모든 값을 배열로 변환
        const arrayData = [];
        Object.values(parsed).forEach(item => {
            if (Array.isArray(item)) {
                arrayData.push(...item);
            } else if (item && typeof item === 'object') {
                arrayData.push(item);
            }
        });

        localStorage.setItem('ssukdiary_growth', JSON.stringify(arrayData));
        console.log('✅ 성장 기록 데이터를 배열로 변환했습니다:', arrayData);
        console.log('🎉 수정 완료! 페이지를 새로고침해주세요.');

    } catch (error) {
        console.error('❌ 데이터 파싱 오류:', error);
        console.log('💡 데이터를 초기화합니다...');
        localStorage.setItem('ssukdiary_growth', '[]');
        console.log('✅ 빈 배열로 초기화 완료! 페이지를 새로고침해주세요.');
    }
})();
