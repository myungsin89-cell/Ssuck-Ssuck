import { useState, useEffect } from 'react';
import MilestoneService from '../services/MilestoneService';
import DataService from '../services/DataService';
import ProgressService from '../services/ProgressService';

const ChecklistModal = ({ isOpen, onClose, currentAgeMonths, childId }) => {
    const [milestones, setMilestones] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState({});
    const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 현재 아이의 체크리스트 가져오기
                const items = DataService.getCheckedItems(childId);
                setCheckedItems(items);

                const data = await MilestoneService.getMilestonesByAge(currentAgeMonths);
                setMilestones(data);

                // 진행률 계산
                const progressData = ProgressService.calculateProgress(items, data);
                setProgress(progressData);
            } catch (error) {
                console.error("Failed to load milestones", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadData();
        }
    }, [currentAgeMonths, isOpen]);

    const toggleCheck = async (id) => {
        const isChecked = !checkedItems[id];
        const newItems = await DataService.toggleChecklist(id, isChecked);
        setCheckedItems({ ...newItems });

        // 진행률 업데이트
        if (milestones) {
            const progressData = ProgressService.calculateProgress(newItems, milestones);
            setProgress(progressData);
        }
    };

    if (!isOpen) return null;

    const progressColor = ProgressService.getProgressColor(progress.percentage);

    return (
        <>
            {/* 오버레이 */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9998,
                    animation: 'fadeIn 0.3s ease-out'
                }}
            />

            {/* 모달 콘텐츠 */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'white',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* 헤더 */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-dark)' }}>
                            {milestones?.age_label} 체크리스트
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                fontSize: '1.5rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                color: '#666'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* 진행률 */}
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                        }}>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                {ProgressService.getProgressText(progress.completed, progress.total)}
                            </span>
                            <span style={{
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                color: progressColor
                            }}>
                                {progress.percentage}%
                            </span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress.percentage}%`,
                                height: '100%',
                                backgroundColor: progressColor,
                                transition: 'width 0.3s ease',
                                borderRadius: '4px'
                            }} />
                        </div>
                    </div>
                </div>

                {/* 본문 (스크롤 가능) */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    paddingBottom: '40px'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
                    ) : !milestones ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>데이터가 없습니다.</div>
                    ) : (
                        milestones.categories.map(category => (
                            <div key={category.id} style={{ marginBottom: '24px' }}>
                                <h4 style={{
                                    fontSize: '1rem',
                                    color: 'var(--text-main)',
                                    marginBottom: '12px',
                                    borderBottom: '2px solid var(--secondary-color)',
                                    display: 'inline-block',
                                    paddingBottom: '4px'
                                }}>
                                    {category.label}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {category.items.map(item => (
                                        <label key={item.id} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            padding: '12px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            cursor: 'pointer',
                                            border: '1px solid #f0f0f0'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={!!checkedItems[item.id]}
                                                onChange={() => toggleCheck(item.id)}
                                                style={{
                                                    marginTop: '4px',
                                                    marginRight: '12px',
                                                    accentColor: 'var(--primary-color)',
                                                    transform: 'scale(1.2)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: '0.95rem',
                                                color: checkedItems[item.id] ? '#aaa' : 'var(--text-main)',
                                                textDecoration: checkedItems[item.id] ? 'line-through' : 'none',
                                                lineHeight: '1.5'
                                            }}>
                                                {item.text}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

export default ChecklistModal;
