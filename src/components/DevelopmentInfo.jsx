import { useState, useEffect } from 'react';
import MilestoneService from '../services/MilestoneService';
import DataService from '../services/DataService';
import ProgressService from '../services/ProgressService';
import ChecklistCard from './ChecklistCard';
import ChecklistModal from './ChecklistModal';

const DevelopmentInfo = ({ childId, currentAgeMonths }) => {
    const [milestones, setMilestones] = useState(null);
    const [milestoneRange, setMilestoneRange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
    const [expandedSections, setExpandedSections] = useState({
        features: false,
        parentingGuide: false,
        activities: false,
        toys: false,
        redFlags: false
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await MilestoneService.getMilestonesByAge(currentAgeMonths);
            setMilestones(data);

            // 마일스톤 범위 계산 (몇 개월까지 이 단계인지)
            const rangeData = await MilestoneService.getMilestoneRange(currentAgeMonths);
            setMilestoneRange(rangeData);

            // 진행률 계산 - 현재 선택된 아이의 체크리스트만 가져옴
            const checkedItems = DataService.getCheckedItems(childId);
            const progressData = ProgressService.calculateProgress(checkedItems, data);
            setProgress(progressData);
        } catch (error) {
            console.error("Failed to load development data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [childId, currentAgeMonths]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
    if (!milestones) return <div style={{ padding: '20px', textAlign: 'center' }}>데이터가 없습니다.</div>;

    return (
        <div style={{ marginTop: '20px', paddingBottom: '40px' }}>
            <h3 style={{ marginBottom: '5px', color: 'var(--primary-dark)' }}>
                {milestones.age_label} 발달 정보
            </h3>
            {milestoneRange && parseInt(milestones.id) !== currentAgeMonths && (
                <div style={{ marginBottom: '20px', fontSize: '0.8rem', color: '#718096', letterSpacing: '-0.5px' }}>
                    💡 <span style={{ fontWeight: 'bold' }}>{milestoneRange.rangeEnd}개월</span>까지는 <span style={{ fontWeight: 'bold' }}>{milestones.age_label}</span> 단계를 기준으로 확인해요. (K-DST 및 표준보육과정)
                </div>
            )}
            {parseInt(milestones.id) === currentAgeMonths && (
                <div style={{ marginBottom: '20px' }}></div>
            )}

            {/* 체크리스트 카드 통합 */}
            <ChecklistCard
                currentAgeMonths={currentAgeMonths}
                ageLabel={milestones.age_label}
                progress={progress}
                onClick={() => setIsModalOpen(true)}
            />

            {/* 체크리스트 모달 */}
            <ChecklistModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    loadData(); // 모달 닫을 때 데이터 갱신
                }}
                currentAgeMonths={currentAgeMonths}
                childId={childId}
            />


            {/* 발달 특징 섹션 */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => toggleSection('features')}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#E3F2FD',
                        border: 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1976D2' }}>
                        📚 이 시기 발달 특징
                    </span>
                    <span style={{ fontSize: '1.2rem' }}>
                        {expandedSections.features ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSections.features && milestones.developmental_features && (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '10px 20px 20px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        {/* 영역별로 그룹화하여 렌더링 */}
                        {[
                            { id: 'social', label: '사회성/정서', icon: '🤝', color: '#E91E63' },
                            { id: 'language', label: '언어/의사소통', icon: '💬', color: '#2196F3' },
                            { id: 'cognitive', label: '인지', icon: '💡', color: '#FF9800' },
                            { id: 'physical', label: '신체발달', icon: '💪', color: '#4CAF50' }
                        ].map((category) => {
                            const features = milestones.developmental_features[category.id];
                            if (!features || features.length === 0) return null;

                            return (
                                <div key={category.id} style={{ marginTop: '15px' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        color: category.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginBottom: '8px',
                                        backgroundColor: `${category.color}10`,
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        width: 'fit-content'
                                    }}>
                                        <span>{category.icon}</span> {category.label}
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {features.map((feature, index) => (
                                            <li key={index} style={{
                                                marginBottom: '6px',
                                                paddingLeft: '15px',
                                                position: 'relative',
                                                lineHeight: '1.5',
                                                fontSize: '0.9rem',
                                                color: '#444'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    color: category.color,
                                                    fontWeight: 'bold'
                                                }}>•</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 부모님을 위한 성장 가이드 섹션 (New) */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => toggleSection('parentingGuide')}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#F3E5F5',
                        border: 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#7B1FA2' }}>
                        💡 부모님을 위한 성장 가이드
                    </span>
                    <span style={{ fontSize: '1.2rem', color: '#7B1FA2' }}>
                        {expandedSections.parentingGuide ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSections.parentingGuide && milestones.parenting_guide && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        backgroundColor: 'white',
                        padding: '10px 0'
                    }}>
                        {milestones.parenting_guide.map((guide, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f9f4ff 100%)',
                                boxShadow: '0 2px 10px rgba(123, 31, 162, 0.05)',
                                borderLeft: '4px solid #9C27B0'
                            }}>
                                <div style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    color: '#4A148C',
                                    lineHeight: '1.5',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <span>✨</span>
                                    {guide.action}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6A1B9A',
                                    backgroundColor: '#F3E5F580',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    lineHeight: '1.4'
                                }}>
                                    <span style={{ fontWeight: 'bold', marginRight: '4px' }}>🌱 발달 효과:</span>
                                    {guide.effect}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 추천 놀이 섹션 */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => toggleSection('activities')}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#F1F8E9',
                        border: 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#558B2F' }}>
                        🎮 추천 놀이
                    </span>
                    <span style={{ fontSize: '1.2rem' }}>
                        {expandedSections.activities ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSections.activities && milestones.recommended_activities && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {milestones.recommended_activities.map((activity) => (
                            <div key={activity.id} style={{
                                backgroundColor: 'white',
                                padding: '16px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                borderLeft: '4px solid #7CB342'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#558B2F', margin: 0 }}>
                                        {activity.title}
                                    </h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#F1F8E9',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        color: '#558B2F',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '8px'
                                    }}>
                                        {activity.duration}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: '8px 0', color: '#555' }}>
                                    {activity.description}
                                </p>
                                <div style={{ fontSize: '0.8rem', color: '#7CB342', fontWeight: 'bold' }}>
                                    #{activity.category}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 추천 장난감 섹션 */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => toggleSection('toys')}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#FFF3E0',
                        border: 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#F57C00' }}>
                        🧸 추천 장난감
                    </span>
                    <span style={{ fontSize: '1.2rem' }}>
                        {expandedSections.toys ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSections.toys && milestones.recommended_toys && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {milestones.recommended_toys.map((toy) => (
                            <div key={toy.id} style={{
                                backgroundColor: 'white',
                                padding: '16px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                borderLeft: '4px solid #FF9800'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#F57C00', margin: 0 }}>
                                        {toy.name}
                                    </h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#FFF3E0',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        color: '#F57C00',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '8px'
                                    }}>
                                        {toy.category}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0' }}>
                                    {toy.description}
                                </p>
                                <div style={{
                                    fontSize: '0.85rem',
                                    backgroundColor: '#FFF8E1',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    lineHeight: '1.5'
                                }}>
                                    <strong style={{ color: '#F57C00' }}>왜 좋을까요?</strong>
                                    <br />
                                    {toy.why}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 주의 신호(Red Flags) 섹션 - 추천 장난감 하단으로 이동 및 카드형 개선 */}
            {milestones.red_flags && (
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => toggleSection('redFlags')}
                        style={{
                            width: '100%',
                            padding: '15px',
                            backgroundColor: '#FFF5F5',
                            border: '1px solid #FED7D7',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: '10px'
                        }}
                    >
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#E53E3E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ 이럴 땐 상담이 필요해요!
                        </span>
                        <span style={{ fontSize: '1.2rem', color: '#E53E3E' }}>
                            {expandedSections.redFlags ? '▼' : '▶'}
                        </span>
                    </button>

                    {expandedSections.redFlags && (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            borderLeft: '4px solid #F56565'
                        }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {milestones.red_flags.map((flag, index) => (
                                    <li key={index} style={{
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        color: '#4A5568',
                                        lineHeight: '1.6'
                                    }}>
                                        <span style={{ color: '#F56565', fontWeight: 'bold' }}>•</span>
                                        {flag}
                                    </li>
                                ))}
                            </ul>
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#FAFAFA',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#718096',
                                fontStyle: 'italic'
                            }}>
                                * 위 징후들은 아이마다 나타나는 시기가 다를 수 있습니다. 다만, 지속적으로 관찰될 경우 소아청소년과 전문의와 상담해 보시는 것을 권장합니다.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 공신력 출처 표기 */}
            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                fontSize: '0.85rem',
                color: '#666',
                lineHeight: '1.6',
                border: '1px solid #eee'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>💡</span> 안내 및 출처
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>• 본 정보는 미국 질병통제예방센터(CDC), 한국 영유아 발달선별검사(K-DST), 그리고 <strong>제4차 표준보육과정(보건복지부)</strong> 지침을 바탕으로 제작되었습니다.</div>
                    <div>• 발달 속도는 아이마다 다를 수 있으므로 참고용으로 활용하시고, 전문가의 진단을 대신할 수 없습니다.</div>
                    <div>• <strong>주의사항:</strong> 특정 발달 단계가 늦어져 걱정되신다면 꼭 소아청소년과 전문의와 상담하세요.</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#aaa', textAlign: 'right' }}>
                    Source: CDC / K-DST / 제4차 표준보육과정 해설서
                </div>
            </div>
        </div>
    );
};

export default DevelopmentInfo;
