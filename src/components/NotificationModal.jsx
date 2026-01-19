
import React from 'react';

const NotificationModal = ({ isOpen, onClose, notifications, onRead }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '300px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #EDF2F7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F7FAFC'
            }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#2D3748', fontWeight: 'bold' }}>알림 센터 🔔</h3>
                <button
                    onClick={() => {
                        onRead();
                        onClose();
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.8rem',
                        color: '#718096',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    모두 읽음
                </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: '0.9rem' }}>
                        새로운 알림이 없습니다.
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {notifications.map(noti => (
                            <li key={noti.id} style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #EDF2F7',
                                backgroundColor: 'white',
                                transition: 'background-color 0.2s'
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4A5568', marginBottom: '4px' }}>
                                    {noti.senderName}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#2D3748', marginBottom: '4px' }}>
                                    {noti.content}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#A0AEC0' }}>
                                    {new Date(noti.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationModal;
