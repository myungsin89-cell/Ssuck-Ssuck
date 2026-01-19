import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState('unknown'); // 'ios', 'android', 'desktop'
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // 플랫폼 감지
        const detectPlatform = () => {
            const ua = navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(ua);
            const isAndroid = /android/.test(ua);
            const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone
                || document.referrer.includes('android-app://');

            if (isInStandaloneMode) {
                // 이미 설치됨
                return null;
            }

            if (isIOS) return 'ios';
            if (isAndroid) return 'android';
            return 'desktop';
        };

        const detectedPlatform = detectPlatform();
        setPlatform(detectedPlatform);

        // iOS: beforeinstallprompt 없음, 수동 안내 필요
        if (detectedPlatform === 'ios') {
            // localStorage에서 이전에 닫았는지 확인
            const dismissed = localStorage.getItem('ssukdiary_install_dismissed');
            if (!dismissed) {
                // 5초 후 표시 (사용자가 앱을 둘러본 후)
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 5000);
                return () => clearTimeout(timer);
            }
        }

        // Android/Desktop: beforeinstallprompt 이벤트 사용
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
            console.log('beforeinstallprompt 이벤트 발생');
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (platform === 'ios') {
            // iOS: 설치 방법 안내 표시
            setShowInstructions(true);
        } else if (deferredPrompt) {
            // Android: 네이티브 프롬프트 표시
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`사용자 응답: ${outcome}`);
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // 24시간 동안 다시 표시하지 않음
        localStorage.setItem('ssukdiary_install_dismissed', Date.now().toString());
    };

    if (!isVisible) return null;

    // iOS 설치 안내 모달
    if (showInstructions && platform === 'ios') {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                        📱 쑥쑥일기 앱 설치하기
                    </div>

                    <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#4A5568', marginBottom: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <strong>Safari 브라우저에서:</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                            <span style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                flexShrink: 0
                            }}>1</span>
                            <div>
                                화면 하단 <strong>공유 버튼</strong> <span style={{ fontSize: '1.2rem' }}>⎋</span> 탭
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                            <span style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                flexShrink: 0
                            }}>2</span>
                            <div>
                                <strong>"홈 화면에 추가"</strong> 선택
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                flexShrink: 0
                            }}>3</span>
                            <div>
                                <strong>"추가"</strong> 버튼 탭
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setShowInstructions(false);
                            setIsVisible(false);
                        }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        확인
                    </button>
                </div>
            </div>
        );
    }

    // 설치 프롬프트 배너
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #E2E8F0',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: 'white'
                }}>
                    🌱
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2D3748' }}>
                        쑥쑥일기 앱 설치
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                        더 빠르고 편하게 기록하세요!
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={handleDismiss}
                    style={{
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#A0AEC0',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    ✕
                </button>
                <button
                    onClick={handleInstallClick}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                    }}
                >
                    설치하기
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
