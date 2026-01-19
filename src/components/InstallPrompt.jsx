
import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // 기본 설치 프롬프트 무시
            e.preventDefault();
            // 이벤트 저장
            setDeferredPrompt(e);
            // UI 표시
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // 설치 프롬프트 표시
        deferredPrompt.prompt();

        // 사용자 응답 대기
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // 변수 초기화
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

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
                    onClick={() => setIsVisible(false)}
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
