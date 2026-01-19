import React, { useState, useEffect } from 'react';

const AppInstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(ua);
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone
            || document.referrer.includes('android-app://');

        // 이미 앱으로 실행 중이면 버튼 숨김
        if (isInStandaloneMode) return;

        if (isIOSDevice) {
            setIsIOS(true);
            setIsVisible(true);
        } else {
            // Android/Desktop
            const handler = (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setIsVisible(true);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const handleClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <button
                onClick={handleClick}
                style={{
                    backgroundColor: 'white',
                    color: 'var(--primary-dark)',
                    border: '1px solid #E2E8F0',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    marginTop: '10px',
                    width: '100%',
                    maxWidth: '340px',
                    justifyContent: 'center'
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>📲</span>
                앱으로 설치하고 더 편하게 쓰기
            </button>

            {/* iOS 설치 안내 모달 */}
            {showIOSInstructions && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setShowIOSInstructions(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '20px',
                        maxWidth: '320px',
                        width: '100%',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '16px', color: '#2D3748' }}>아이폰에 설치하기</h3>
                        <p style={{ fontSize: '0.95rem', color: '#4A5568', lineHeight: '1.6', marginBottom: '20px' }}>
                            하단의 <strong>공유</strong> 버튼 <span style={{ fontSize: '1.2rem' }}>⎋</span>을 누르고<br />
                            <strong>'홈 화면에 추가'</strong>를 선택해주세요.
                        </p>
                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                            }}
                        >
                            알겠어요
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AppInstallButton;
