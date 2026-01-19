import { useState, useEffect } from 'react';
import DataService from '../services/DataService';

const FamilyInvite = ({ childId }) => {
    const [familyGroup, setFamilyGroup] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (childId) {
            const group = DataService.getFamilyGroupByChildId(childId);
            setFamilyGroup(group);
        }
    }, [childId]);

    const handleCopyCode = () => {
        if (familyGroup?.inviteCode) {
            navigator.clipboard.writeText(familyGroup.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!familyGroup) return null;

    return (
        <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#F3E5F5',
            borderRadius: '12px',
            border: '1px solid #E1BEE7'
        }}>
            <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 'bold',
                color: '#7B1FA2',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                👨‍👩‍👧 가족 초대
            </h4>

            {/* 초대 코드 */}
            <div style={{
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                        초대 코드
                    </div>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#7B1FA2',
                        letterSpacing: '2px'
                    }}>
                        {familyGroup.inviteCode}
                    </div>
                </div>
                <button
                    onClick={handleCopyCode}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: copied ? '#4CAF50' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {copied ? '✓ 복사됨' : '복사'}
                </button>
            </div>

            {/* 가족 구성원 목록 */}
            <div>
                <div style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginBottom: '8px'
                }}>
                    가족 구성원 ({familyGroup.members.length}명)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {familyGroup.members.map((member, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: '#555'
                        }}>
                            <span>{member.role === 'owner' ? '👑' : '👤'}</span>
                            <span style={{ fontWeight: member.role === 'owner' ? 'bold' : 'normal' }}>
                                {member.name}
                            </span>
                            {member.role === 'owner' && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: '#9C27B0',
                                    backgroundColor: '#F3E5F5',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    관리자
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                marginTop: '12px',
                fontSize: '0.7rem',
                color: '#999',
                lineHeight: '1.4'
            }}>
                💡 가족 구성원에게 초대 코드를 공유하면 함께 아이의 성장을 기록할 수 있어요!
            </div>
        </div>
    );
};

export default FamilyInvite;
