import React, { useState } from 'react';
import VaccinationTracker from './VaccinationTracker';
import AllergyManager from './AllergyManager';
import IllnessManager from './IllnessManager';
import SupplementManager from './SupplementManager';

const HealthRecords = ({ childId, child }) => {
    const [activeCategory, setActiveCategory] = useState('dashboard');

    const categories = [
        { id: 'dashboard', label: '건강 대시보드', icon: '📊' },
        { id: 'vaccination', label: '예방접종', icon: '💉' },
        { id: 'allergies', label: '알레르기', icon: '🤧' },
        { id: 'illnesses', label: '질병 이력', icon: '🦠' },
        { id: 'illnesses', label: '질병 이력', icon: '🦠' },
        { id: 'supplements', label: '영양제 관리', icon: '💊' },
        { id: 'ai_doctor', label: 'AI 건강 주치의', icon: '🤖' }
    ];

    // [유지보수 모드] true: 안내 화면 표시, false: 정상 기능 오픈
    const isMaintenanceMode = true;

    if (isMaintenanceMode) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
                <h2 style={{ color: 'var(--primary-dark)', marginBottom: '10px' }}>건강 기록 업데이트 준비 중!</h2>
                <p style={{ color: '#666', marginBottom: '30px', maxWidth: '300px', lineHeight: '1.6' }}>
                    더 나은 기능 제공을 위해 잠시 정비 중입니다.<br />
                    곧 멋진 기능으로 찾아올게요!
                </p>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    textAlign: 'left',
                    width: '100%',
                    maxWidth: '320px'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: '#2D3748' }}>🚀 준비 중인 기능</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {categories.map(cat => (
                            <li key={cat.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', color: '#4A5568' }}>
                                <span style={{ marginRight: '10px' }}>{cat.icon}</span>
                                {cat.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa'
        }}>
            {/* 헤더 */}
            <header style={{
                backgroundColor: 'white',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderBottom: '1px solid #eee'
            }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-dark)',
                    marginBottom: '8px'
                }}>
                    🏥 건강 기록
                </h1>
                <p style={{
                    fontSize: '0.9rem',
                    color: '#666'
                }}>
                    우리 아이 담당 의사 👨‍⚕️
                </p>
            </header>

            {/* 카테고리 탭 */}
            <div style={{
                backgroundColor: 'white',
                padding: '12px 20px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid #eee',
                WebkitOverflowScrolling: 'touch', // iOS 부드러운 스크롤
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none' // IE/Edge
            }}>
                <style>{`
                    /* 스크롤바 숨김 (Chrome, Safari) */
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeCategory === cat.id ? 'var(--primary-color)' : '#f5f5f5',
                                color: activeCategory === cat.id ? 'white' : '#666',
                                border: 'none',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: activeCategory === cat.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                if (activeCategory !== cat.id) {
                                    e.currentTarget.style.backgroundColor = '#e0e0e0';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeCategory !== cat.id) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }
                            }}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingBottom: '80px'
            }}>
                {activeCategory === 'dashboard' && (
                    <HealthDashboard childId={childId} child={child} onNavigate={setActiveCategory} />
                )}
                {activeCategory === 'vaccination' && (
                    <VaccinationTracker childId={childId} child={child} />
                )}
                {activeCategory === 'allergies' && (
                    <AllergyManager childId={childId} />
                )}
                {activeCategory === 'illnesses' && (
                    <IllnessManager childId={childId} />
                )}
                {activeCategory === 'supplements' && (
                    <SupplementManager childId={childId} child={child} />
                )}
            </div>
        </div>
    );
};

// 건강 대시보드 컴포넌트
const HealthDashboard = ({ childId, child, onNavigate }) => {
    return (
        <div>
            {/* 건강 요약 카드 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '16px'
                }}>
                    📊 건강 요약
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                }}>
                    <SummaryCard icon="💉" label="예방접종" value="12/15" />
                    <SummaryCard icon="🤧" label="알레르기" value="0건" />
                    <SummaryCard icon="🏥" label="입원 기록" value="0건" />
                    <SummaryCard icon="💊" label="영양제" value="0개" />
                </div>
            </div>

            {/* AI 건강 조언 */}
            <div style={{
                backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🤖</span>
                    <h2 style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}>
                        AI 건강 조언
                    </h2>
                </div>
                <p style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    opacity: 0.95
                }}>
                    {child?.name || '아이'}의 건강 데이터를 분석하고 있어요.
                    건강 기록을 추가하면 더 정확한 맞춤 조언을 드릴 수 있어요! 🌟
                </p>
            </div>

            {/* 빠른 액션 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '16px'
                }}>
                    ⚡ 빠른 기록
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <QuickActionButton icon="🤧" label="알레르기 추가" onClick={() => onNavigate('allergies')} />
                    <QuickActionButton icon="🏥" label="입원 기록 추가" onClick={() => onNavigate('illnesses')} />
                    <QuickActionButton icon="🦠" label="질병 이력 추가" onClick={() => onNavigate('illnesses')} />
                    <QuickActionButton icon="💊" label="영양제 추가" onClick={() => onNavigate('supplements')} />
                </div>
            </div>
        </div>
    );
};

// 요약 카드 컴포넌트
const SummaryCard = ({ icon, label, value }) => (
    <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{value}</div>
    </div>
);

// 빠른 액션 버튼 컴포넌트
const QuickActionButton = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '500',
            color: '#333',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8e9ea';
            e.currentTarget.style.borderColor = 'var(--primary-color)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = '#e0e0e0';
        }}
    >
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span>{label}</span>
    </button>
);

export default HealthRecords;
