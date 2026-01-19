// 브라우저 콘솔에서 실행: localStorage 초기화 스크립트
// 사용법: 브라우저 콘솔(F12)에서 이 코드를 복사해서 붙여넣고 Enter

console.log('🔧 localStorage 초기화 시작...');

// 성장 기록 데이터를 배열로 초기화
localStorage.setItem('ssukdiary_growth', '[]');
console.log('✅ 성장 기록 데이터 초기화 완료');

// 페이지 새로고침
console.log('🔄 페이지를 새로고침합니다...');
location.reload();
