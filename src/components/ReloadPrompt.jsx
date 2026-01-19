
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    if (!needRefresh) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px', // InstallPrompt 위에 표시
            right: '20px',
            left: '20px',
            backgroundColor: '#333',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>새로운 버전이 있습니다! ✨</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                최신 기능 이용을 위해 업데이트해주세요.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '5px' }}>
                <button
                    onClick={() => close()}
                    style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid #666',
                        color: '#ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    나중에
                </button>
                <button
                    onClick={() => updateServiceWorker(true)}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#4CAF50',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    업데이트
                </button>
            </div>
        </div>
    );
}

export default ReloadPrompt;
