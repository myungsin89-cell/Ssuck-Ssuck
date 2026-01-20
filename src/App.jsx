import { useState, useEffect } from 'react';
import ChildProfile from './components/ChildProfile';
import ObservationLog from './components/ObservationLog';
import DevelopmentInfo from './components/DevelopmentInfo';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ChildRegistration from './components/ChildRegistration';
import ParentingChat from './components/ParentingChat';
import GrowthTracker from './components/GrowthTracker';
import HealthRecords from './components/HealthRecords';
import DataService from './services/DataService';
import FamilySettings from './components/FamilySettings';
import NotificationService from './services/NotificationService';
import NotificationModal from './components/NotificationModal';
import InstallPrompt from './components/InstallPrompt';
import ReloadPrompt from './components/ReloadPrompt';

function App() {
  const [appStage, setAppStage] = useState('loading');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentAgeMonths, setCurrentAgeMonths] = useState(0);
  const [activeTab, setActiveTab] = useState('log');
  const [childInfo, setChildInfo] = useState(null);
  const [children, setChildren] = useState([]);

  // 알림 상태
  const [notifications, setNotifications] = useState([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  useEffect(() => {
    // 앱 초기 상태 판별
    const checkStatus = async () => {
      try {
        const currentUser = DataService.getCurrentUser();

        // [초대 링크 처리] URL 파라미터 확인 및 자동 가입 시도
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite');

        if (inviteCode) {
          if (currentUser) {
            // 로그인 상태면 즉시 가입 시도
            const result = await DataService.joinFamilyGroup(inviteCode, currentUser.userId, currentUser.name);

            if (result.success) {
              alert(result.message);
              // URL 파라미터 깔끔하게 제거
              window.history.replaceState({}, document.title, window.location.pathname);
              // 데이터 갱신 (가입 후 내 아이 목록 업데이트)
              const updatedList = DataService.getChildren(currentUser.userId);
              setChildren(updatedList);
            } else {
              // 에러 메시지 표시 (이미 가입된 경우는 조용히 넘어감)
              if (result.message !== '이미 가입된 그룹입니다.') {
                alert(result.message);
              }
              // URL 파라미터 제거
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            // 비로그인 상태: 로그인 후 처리를 위해 저장
            sessionStorage.setItem('pendingInviteCode', inviteCode);
          }
        }

        if (!currentUser) {
          setAppStage('login');
          return;
        }

        // 로그인 상태라면 클라우드 데이터 동기화 시도
        try {
          await DataService.syncFromServer();
        } catch (syncError) {
          console.error('App: Sync with server failed on init', syncError);
        }

        // 사용자가 접근 가능한 아이 목록 로드
        let childList = DataService.getChildren(currentUser.userId);

        // 방어 코드: 배열이 아닐 경우 빈 배열로 처리
        if (!Array.isArray(childList)) {
          console.error('App: childList is not an array!', childList);
          childList = [];
        }

        const selectedId = DataService.getSelectedChildId();

        setChildren(childList);

        // 아이가 있든 없든 대시보드가 기본 진입점 (단, 아이가 있고 선택된 상태면 바로 메인으로 갈 수도 있음)
        if (selectedId && childList.find(c => c.id === selectedId)) {
          const selectedChild = childList.find(c => c.id === selectedId);
          setChildInfo(selectedChild);
          setAppStage('main');
        } else {
          setAppStage('dashboard');
        }
      } catch (error) {
        console.error('Initial check failed:', error);
        alert('데이터를 불러오는 중 문제가 발생했습니다. 다시 로그인해주세요.');
        DataService.setCurrentUser(null);
        setAppStage('login');
      }
    };
    checkStatus();


    // 주기적 알림 체크 (1분마다) - 선택 사항
    const interval = setInterval(() => {
      const user = DataService.getCurrentUser();
      const selectedId = DataService.getSelectedChildId();
      if (user && selectedId) {
        NotificationService.checkForNewLogs(selectedId, user.userId).then(notis => {
          setNotifications(notis);
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user) => {
    // 이미 Login 컴포넌트에서 setCurrentUser를 호출했으므로 여기서는 생략 가능하거나
    // DataService.setCurrentUser(user.id, user.nickname); 처럼 써야 함. 중복이므로 제거.

    // 사용자가 접근 가능한 아이 목록 로드
    const childList = DataService.getChildren(user.id);
    setChildren(childList);

    // 무조건 대시보드로 이동 (아이가 없어도)
    setAppStage('dashboard');
  };

  const handleChildSave = (child) => {
    const currentUser = DataService.getCurrentUser();
    if (!currentUser) return;

    // 사용자가 접근 가능한 아이 목록 다시 로드
    const updatedChildren = DataService.getChildren(currentUser.userId);
    setChildren(updatedChildren);
    setChildInfo(child);
    DataService.setSelectedChildId(child.id);
    setAppStage('dashboard');
  };

  const handleChildSelect = async (child) => {
    setChildInfo(child);
    DataService.setSelectedChildId(child.id);
    // 선택된 아이의 상세 정보(체크리스트 등) 동기화
    await DataService.syncFromServer();
    setAppStage('main');
  };

  const handleUpdateChild = (updatedChild) => {
    const currentUser = DataService.getCurrentUser();
    if (!currentUser) return;

    const updatedChildren = DataService.getChildren(currentUser.userId);
    setChildren(updatedChildren);
    setChildInfo(updatedChild);
  };

  const handleDeleteChild = (childId) => {
    const currentUser = DataService.getCurrentUser();
    if (!currentUser) return;

    console.log('App: Deleting child', childId);
    const success = DataService.deleteChild(childId, currentUser.userId);

    if (success) {
      // 아이 목록 다시 로드
      const updatedChildren = DataService.getChildren(currentUser.userId);
      console.log('App: Updated children list', updatedChildren);

      setChildren(updatedChildren);

      // 삭제된 아이가 현재 선택된 아이였다면 선택 해제
      if (childInfo && String(childInfo.id) === String(childId)) {
        setChildInfo(null);
      }

      // 아이가 남아있으면 dashboard 유지, 없으면 등록 화면으로
      if (updatedChildren && updatedChildren.length > 0) {
        console.log('App: Remaining children found, showing dashboard');
        setAppStage('dashboard');
        // 강제로 첫 번째 아이 선택 (또는 null 처리하여 대시보드에서 선택하게 함)
        setChildInfo(null);
      } else {
        console.log('App: No children left, moving to registration');
        setAppStage('registration');
        setChildInfo(null);
      }
    } else {
      alert('아이 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    // 로그아웃 확인
    const confirmed = window.confirm('로그아웃 하시겠습니까?');
    if (confirmed) {
      // 사용자 정보 초기화
      localStorage.removeItem('ssukdiary_current_user');
      localStorage.removeItem('ssukdiary_user_info');

      // 상태 초기화
      setChildInfo(null);
      setChildren([]);
      setAppStage('login');
    }
  };

  if (appStage === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👶</div>
        <div>데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (appStage === 'login') {
    return <Login onLogin={handleLoginSuccess} />;
  }

  if (appStage === 'registration') {
    return <ChildRegistration onSave={handleChildSave} onLogout={handleLogout} />;
  }

  if (appStage === 'dashboard') {
    return (
      <Dashboard
        childrenList={children}
        onSelect={handleChildSelect}
        onAddChild={() => setAppStage('registration')}
        onDeleteChild={handleDeleteChild}
        onLogout={handleLogout}
        onRefresh={() => {
          const currentUser = DataService.getCurrentUser();
          if (currentUser) {
            setChildren(DataService.getChildren(currentUser.userId));
          }
        }}
      />
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <h1 style={{ color: 'var(--primary-dark)', fontSize: '1.5rem', fontWeight: 'bold' }}>쑥쑥일기 🌱</h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 알림 아이콘 */}
          <button
            onClick={() => setIsNotiOpen(!isNotiOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FAB005',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#FFF9DB',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#FA5252',
                border: '2px solid white'
              }} />
            )}
          </button>

          {/* 가족 초대 아이콘 */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#A0AEC0',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#F7FAFC'
            }}
          >
            {/* User Plus Icon SVG (가족 초대) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 알림 모달 */}
        <NotificationModal
          isOpen={isNotiOpen}
          onClose={() => setIsNotiOpen(false)}
          notifications={notifications}
          onRead={() => {
            NotificationService.markAsRead();
            setNotifications([]);
          }}
        />
      </header>

      <main>
        <ChildProfile
          child={childInfo}
          onAgeChange={setCurrentAgeMonths}
          onSwitchChild={() => {
            const currentUser = DataService.getCurrentUser();
            if (!currentUser) return;

            const childList = DataService.getChildren(currentUser.userId);
            setChildren(childList);
            setAppStage('dashboard');
          }}
          onUpdateChild={handleUpdateChild}
        />

        {activeTab === 'log' && (
          <ObservationLog
            childId={childInfo?.id}
            currentAgeMonths={currentAgeMonths}
          />
        )}
        {activeTab === 'info' && (
          <DevelopmentInfo
            childId={childInfo?.id}
            currentAgeMonths={currentAgeMonths}
          />
        )}
        {activeTab === 'growth' && (
          <GrowthTracker childId={childInfo?.id} child={childInfo} />
        )}
        {activeTab === 'health' && (
          <HealthRecords childId={childInfo?.id} child={childInfo} />
        )}
        {activeTab === 'chat' && (
          <ParentingChat childId={childInfo?.id} child={childInfo} />
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 가족 설정 모달 */}
      <FamilySettings
        child={childInfo}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          setIsSettingsOpen(false);
          const handleLogout = () => {
            DataService.setLoggedIn(null); // 만약 App 내에 handleLogout에 로직이 있다면 그것을 사용해야 하지만, 일단 안전하게 직접 처리
            setAppStage('login');
          };
          // App 내의 handleLogout을 호출하는 것이 가장 좋음. onLogout prop을 통해 전달받은 함수 호출
          handleLogout();
        }}
      />


      {/* PWA 설치 유도 배너 */}
      <InstallPrompt />
      {/* PWA 업데이트 알림 */}
      <ReloadPrompt />
    </div >
  );
}

export default App;
