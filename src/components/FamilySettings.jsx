import { useState, useEffect } from 'react';
import DataService from '../services/DataService';

const FamilySettings = ({ child, isOpen, onClose, onLogout }) => {
    const [familyGroup, setFamilyGroup] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (isOpen && child) {
            const group = DataService.getFamilyGroupByChildId(child.id);
            setFamilyGroup(group);
            const user = DataService.getCurrentUser();
            setCurrentUser(user);
        }
    }, [isOpen, child]);

    const handleCopyCode = async () => {
        if (!familyGroup?.inviteCode) return;

        const inviteUrl = `${window.location.origin}?invite=${familyGroup.inviteCode}`;
        const inviteText = `[쑥쑥일기] ${child.name}의 육아 일기에 초대합니다! 👶\n\n👇 아래 링크를 누르면 바로 연결됩니다:\n${inviteUrl}\n\n(초대 코드: ${familyGroup.inviteCode})`;

        try {
            await navigator.clipboard.writeText(inviteText);
            setCopySuccess('초대 메시지가 복사되었습니다! 카카오톡에 붙여넣어 공유하세요. 📋');
        } catch (err) {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = inviteText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("Copy");
            textArea.remove();
            setCopySuccess('초대 메시지가 복사되었습니다! 📋');
        }

        setTimeout(() => setCopySuccess(''), 3000);
    };

    const handleShare = async () => {
        if (!familyGroup?.inviteCode) return;

        const inviteUrl = `${window.location.origin}?invite=${familyGroup.inviteCode}`;
        const inviteText = `[쑥쑥일기] ${child.name}의 육아 일기에 초대합니다! 👶\n\n👇 아래 링크를 누르면 바로 연결됩니다:\n${inviteUrl}\n\n(초대 코드: ${familyGroup.inviteCode})`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: '쑥쑥일기 가족 초대',
                    text: inviteText,
                });
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        } else {
            handleCopyCode();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '90%',
                maxWidth: '400px',
                borderRadius: '24px',
                padding: '30px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#aaa',
                        padding: '10px'
                    }}
                >
                    ✕
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A202C', marginBottom: '30px', textAlign: 'center' }}>
                    가족 설정 ⚙️
                </h2>

                {/* 섹션 1: 가족 초대 */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4A5568', marginBottom: '15px' }}>
                        가족 초대하기 💌
                    </h3>

                    {familyGroup ? (
                        <div style={{
                            backgroundColor: '#F7FAFC',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid #E2E8F0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '8px' }}>
                                초대 코드
                            </div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: '#553C9A',
                                letterSpacing: '4px',
                                marginBottom: '16px',
                                fontFamily: 'monospace'
                            }}>
                                {familyGroup.inviteCode}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleCopyCode}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #CBD5E0',
                                        borderRadius: '12px',
                                        color: '#4A5568',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    코드 복사
                                </button>
                                <button
                                    onClick={handleShare}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#FAE8FF', // 연한 보라색
                                        border: '1px solid #D6BCFA',
                                        borderRadius: '12px',
                                        color: '#553C9A',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    초대하기
                                </button>
                            </div>

                            {copySuccess && (
                                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#38A169', fontWeight: 'bold' }}>
                                    {copySuccess}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#718096', backgroundColor: '#F7FAFC', borderRadius: '16px' }}>
                            가족 그룹 정보가 없습니다.<br />
                            (새로 등록된 아이가 아닌 경우 생성되지 않았을 수 있습니다.)
                        </div>
                    )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #EDF2F7', margin: '30px 0' }} />

                {/* 섹션 2: 함께하는 가족 */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4A5568', marginBottom: '15px' }}>
                        함께하는 가족 👨‍👩‍👧
                    </h3>

                    {familyGroup && familyGroup.members ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {familyGroup.members.map((member, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    marginBottom: '8px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #EDF2F7'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#EDF2F7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        marginRight: '12px'
                                    }}>
                                        {/* 역할이나 이름에 따라 이모지 다르게? 일단 통일 */}
                                        👤
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: '#2D3748' }}>
                                            {member.name}
                                            {currentUser && String(currentUser.userId) === String(member.userId) && (
                                                <span style={{ fontSize: '0.8rem', color: '#718096', marginLeft: '6px', fontWeight: 'normal' }}>(나)</span>
                                            )}
                                        </div>
                                        {member.role === 'owner' && (
                                            <div style={{ fontSize: '0.8rem', color: '#ED8936' }}>관리자</div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#A0AEC0', textAlign: 'center' }}>가족 멤버 정보가 없습니다.</p>
                    )}
                </div>

                {/* 로그아웃 */}
                <button
                    onClick={() => {
                        if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                            onLogout();
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#FFF5F5',
                        border: '1px solid #FEB2B2',
                        borderRadius: '16px',
                        color: '#C53030',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
};

export default FamilySettings;
