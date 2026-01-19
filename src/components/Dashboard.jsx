import React, { useState } from 'react';
import DataService from '../services/DataService';
import AppInstallButton from './AppInstallButton';

const Dashboard = ({ childrenList = [], onSelect, onAddChild, onDeleteChild, onLogout, onRefresh }) => {
    const [isJoining, setIsJoining] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    // 삭제 모달 상태 추가
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [childToDelete, setChildToDelete] = useState(null);

    const safeChildrenList = Array.isArray(childrenList) ? childrenList : [];

    const handleConfirmDelete = () => {
        if (childToDelete && onDeleteChild) {
            onDeleteChild(childToDelete.id);
        }
        setIsDeleteModalOpen(false);
        setChildToDelete(null);
    };

    const handleDeleteClick = (e, child) => {
        e.stopPropagation(); // 카드 클릭 이벤트 방지
        setChildToDelete(child);
        setIsDeleteModalOpen(true);
    };

    const handleJoinFamily = async () => {
        if (!inviteCode || inviteCode.length !== 6) {
            alert('6자리 초대 코드를 입력해주세요.');
            return;
        }

        const currentUser = DataService.getCurrentUser();
        if (!currentUser) return;

        const result = await DataService.joinFamilyGroup(inviteCode, currentUser.userId, currentUser.name);

        if (result.success) {
            alert(result.message);
            setIsJoining(false);
            setInviteCode('');
            // 목록 갱신 요청
            if (onRefresh) onRefresh();
        } else {
            alert(result.message);
        }
    };

    return (
        <div style={{
            height: '100vh',
            padding: '40px 20px',
            backgroundColor: 'var(--background-color)',
            overflowY: 'auto'
        }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>
                    우리 아이를 선택해주세요 👶
                </h2>
                <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '8px' }}>
                    오늘도 우리 아이들과 소중한 시간을 보내보아요.
                </p>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

                {/* 아이 목록이 없을 때 안내 문구 */}
                {safeChildrenList.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#888',
                        marginBottom: '20px'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👋</div>
                        <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>아직 등록된 아이가 없어요.</p>
                        <p style={{ fontSize: '0.9rem' }}>새로운 아이를 등록하거나 초대 코드로 불러오세요!</p>
                    </div>
                )}

                {/* 아이 리스트 */}
                {safeChildrenList.map(child => (
                    <div
                        key={child.id}
                        style={{
                            width: '100%',
                            maxWidth: '340px',
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '20px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s ease',
                            border: '2px solid transparent',
                            position: 'relative'
                        }}
                    >
                        {/* X 삭제 버튼 - 오른쪽 상단 */}
                        <button
                            onClick={(e) => handleDeleteClick(e, child)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: 'transparent',
                                color: '#ccc',
                                border: 'none',
                                borderRadius: '50%',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1',
                                padding: 0
                            }}
                            title="삭제"
                        >
                            ✕
                        </button>

                        {/* 아이 정보 (클릭 가능) */}
                        <div
                            onClick={() => onSelect(child)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                marginRight: '20px',
                                border: '3px solid #f0f0f0',
                                flexShrink: 0
                            }}>
                                <img
                                    src={child.photoUrl}
                                    alt={child.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                                    {child.name}
                                </h3>
                                <p style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: '600' }}>
                                    성장 기록 보기 🌱
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 1. 새 아이 등록하기 버튼 */}
                <button
                    onClick={onAddChild}
                    style={{
                        width: '100%',
                        maxWidth: '340px',
                        padding: '20px',
                        backgroundColor: '#FFF8E1', // 연한 노란색
                        color: 'var(--primary-dark)',
                        border: '2px dashed var(--primary-color)',
                        borderRadius: '24px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>+</span>
                    새로운 우리 아기 등록하기
                </button>

                {/* 2. 초대 코드로 추가하기 버튼 */}
                <button
                    onClick={() => setIsJoining(true)}
                    style={{
                        width: '100%',
                        maxWidth: '340px',
                        padding: '16px',
                        backgroundColor: 'white',
                        color: '#6A1B9A',
                        border: '1px solid #E1BEE7',
                        borderRadius: '16px',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>✉️</span>
                    초대 코드로 아이 부르기
                </button>

                {/* 로그아웃 버튼 */}
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        maxWidth: '340px',
                        padding: '16px',
                        backgroundColor: 'transparent',
                        color: '#999',
                        border: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 'normal',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '10px'
                    }}
                >
                    로그아웃
                </button>


                {/* 앱 설치 버튼 (조건부 렌더링) */}
                <AppInstallButton />
            </main>

            <footer style={{ marginTop: '60px', textAlign: 'center' }}>
                <p style={{ color: '#ccc', fontSize: '0.8rem' }}>쑥쑥일기 v1.0</p>
            </footer>

            {/* 초대 코드 입력 모달 */}
            {
                isJoining && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '320px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginBottom: '15px', color: '#333' }}>초대 코드 입력</h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                                가족에게 공유받은 6자리 코드를 입력해주세요.
                            </p>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="예: ABC123"
                                maxLength={6}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1.2rem',
                                    textAlign: 'center',
                                    letterSpacing: '4px',
                                    border: '2px solid #ddd',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => {
                                        setIsJoining(false);
                                        setInviteCode('');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#f1f3f5',
                                        color: '#666',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleJoinFamily}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: 'var(--primary-color)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 삭제 확인 모달 */}
            {
                isDeleteModalOpen && childToDelete && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2100
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '320px',
                            textAlign: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
                            <h3 style={{ marginBottom: '15px', color: '#E53E3E', fontWeight: 'bold' }}>
                                정말 삭제하시겠습니까?
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: '#4A5568', marginBottom: '10px', lineHeight: '1.5' }}>
                                <strong>"{childToDelete.name}"</strong> 아이의 모든 기록이<br />
                                영구적으로 삭제됩니다.
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#E53E3E', marginBottom: '25px', fontWeight: 'bold' }}>
                                이 작업은 되돌릴 수 없습니다.
                            </p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setChildToDelete(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#EDF2F7',
                                        color: '#4A5568',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#E53E3E',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    삭제하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
