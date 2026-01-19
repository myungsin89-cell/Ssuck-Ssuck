import { useState, useEffect } from 'react';
import vaccinationsData from '../data/vaccinations_ko.json';
import DataService from '../services/DataService';

const VaccinationTracker = ({ childId, currentAgeMonths, child: childProp }) => {
    const [child, setChild] = useState(null);
    const [vaccinationRecords, setVaccinationRecords] = useState({});
    const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
    const [allVaccinations, setAllVaccinations] = useState([]);
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        // Use the child prop passed from parent
        if (childProp) {
            setChild(childProp);
        } else {
            // Fallback: try to get from DataService
            const currentChild = DataService.getChildInfo(childId);
            setChild(currentChild);
        }

        // 접종 기록 불러오기
        const records = DataService.getVaccinationRecords(childId);
        setVaccinationRecords(records);

        // 전체 접종 일정 구성
        const allSchedule = [];
        vaccinationsData.vaccinations.forEach(vaccine => {
            vaccine.schedule.forEach(schedule => {
                allSchedule.push({
                    ...schedule,
                    vaccineId: vaccine.id,
                    vaccineName: vaccine.name,
                    description: vaccine.description,
                    key: `${vaccine.id}_${schedule.dose}`
                });
            });
        });
        setAllVaccinations(allSchedule.sort((a, b) => a.ageMonths - b.ageMonths));

        // 다가오는 접종 (현재 월령 ~ +3개월 이내, 미완료만)
        const upcoming = allSchedule.filter(item => {
            const key = `${item.vaccineId}_${item.dose}`;
            const isCompleted = records[key]?.completed;
            return !isCompleted && item.ageMonths >= currentAgeMonths && item.ageMonths <= currentAgeMonths + 3;
        });
        setUpcomingVaccinations(upcoming);
    }, [childId, currentAgeMonths, childProp]);

    const handleToggle = async (vaccineId, dose) => {
        const key = `${vaccineId}_${dose}`;
        const isCurrentlyCompleted = vaccinationRecords[key]?.completed || false;

        const updatedRecords = await DataService.toggleVaccination(
            childId,
            vaccineId,
            dose,
            !isCurrentlyCompleted,
            !isCurrentlyCompleted ? new Date().toISOString().split('T')[0] : null
        );

        setVaccinationRecords(updatedRecords);

        // 다가오는 접종 목록 갱신
        const upcoming = allVaccinations.filter(item => {
            const itemKey = `${item.vaccineId}_${item.dose}`;
            const isCompleted = updatedRecords[itemKey]?.completed;
            return !isCompleted && item.ageMonths >= currentAgeMonths && item.ageMonths <= currentAgeMonths + 3;
        });
        setUpcomingVaccinations(upcoming);
    };

    const calculateDDay = (targetAgeMonths) => {
        if (!child) return null;
        const birthDate = new Date(child.birthDate);
        const targetDate = new Date(birthDate);
        targetDate.setMonth(targetDate.getMonth() + targetAgeMonths);

        const today = new Date();
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
        if (diffDays === 0) return 'D-Day';
        return `D-${diffDays}`;
    };

    const calculateProgress = () => {
        const total = allVaccinations.length;
        const completed = allVaccinations.filter(item => {
            const key = `${item.vaccineId}_${item.dose}`;
            return vaccinationRecords[key]?.completed;
        }).length;
        return { total, completed, percentage: Math.round((completed / total) * 100) };
    };

    const progress = calculateProgress();

    return (
        <div style={{ marginTop: '20px', paddingBottom: '40px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💉 예방접종 관리
            </h3>

            {/* 진행률 카드 */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#555' }}>전체 접종 진행률</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {progress.percentage}%
                    </span>
                </div>
                <div style={{
                    width: '100%',
                    height: '12px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress.percentage}%`,
                        height: '100%',
                        backgroundColor: 'var(--primary-color)',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
                    {progress.completed} / {progress.total} 완료
                </div>
            </div>

            {/* 다가오는 접종 */}
            {upcomingVaccinations.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                        fontSize: '1.05rem',
                        color: '#E53E3E',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        📌 다가오는 접종 ({upcomingVaccinations.length}건)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {upcomingVaccinations.map(item => {
                            const key = `${item.vaccineId}_${item.dose}`;
                            const dDay = calculateDDay(item.ageMonths);
                            return (
                                <div key={key} style={{
                                    backgroundColor: '#FFF5F5',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '2px solid #FED7D7',
                                    boxShadow: '0 2px 6px rgba(229, 62, 62, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <h5 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#E53E3E', margin: '0 0 4px 0' }}>
                                                {item.vaccineName} {item.dose}차
                                            </h5>
                                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                                                {item.ageLabel}
                                            </p>
                                            {item.note && (
                                                <p style={{ fontSize: '0.75rem', color: '#999', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                                                    * {item.note}
                                                </p>
                                            )}
                                        </div>
                                        {dDay && (
                                            <span style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                color: '#E53E3E',
                                                backgroundColor: 'white',
                                                padding: '4px 10px',
                                                borderRadius: '12px'
                                            }}>
                                                {dDay}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleToggle(item.vaccineId, item.dose)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: 'white',
                                            border: '2px solid #E53E3E',
                                            borderRadius: '8px',
                                            color: '#E53E3E',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        ✅ 접종 완료 체크
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 전체 접종 일정 - 월령별 그룹화 */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                    fontSize: '1.05rem',
                    color: 'var(--primary-dark)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    📅 전체 접종 일정
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                        // 월령별로 그룹화
                        const ageGroups = {
                            '0': { label: '출생 직후 (0개월)', items: [] },
                            '1-2': { label: '생후 1~2개월', items: [] },
                            '4': { label: '생후 4개월', items: [] },
                            '6': { label: '생후 6개월', items: [] },
                            '12-15': { label: '생후 12~15개월', items: [] },
                            '18-24': { label: '생후 18~24개월', items: [] },
                            '48-72': { label: '만 4~6세', items: [] },
                            '144+': { label: '만 12세 이상', items: [] }
                        };

                        allVaccinations.forEach(item => {
                            const months = item.ageMonths;
                            if (months === 0) {
                                ageGroups['0'].items.push(item);
                            } else if (months >= 1 && months <= 2) {
                                ageGroups['1-2'].items.push(item);
                            } else if (months === 4) {
                                ageGroups['4'].items.push(item);
                            } else if (months === 6) {
                                ageGroups['6'].items.push(item);
                            } else if (months >= 12 && months <= 15) {
                                ageGroups['12-15'].items.push(item);
                            } else if (months >= 18 && months <= 24) {
                                ageGroups['18-24'].items.push(item);
                            } else if (months >= 48 && months <= 72) {
                                ageGroups['48-72'].items.push(item);
                            } else if (months >= 144) {
                                ageGroups['144+'].items.push(item);
                            }
                        });

                        return Object.entries(ageGroups).map(([groupKey, group]) => {
                            if (group.items.length === 0) return null;

                            const isExpanded = expandedSections[groupKey];
                            const completedCount = group.items.filter(item => {
                                const key = `${item.vaccineId}_${item.dose}`;
                                return vaccinationRecords[key]?.completed;
                            }).length;

                            return (
                                <div key={groupKey} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #eee',
                                    overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => setExpandedSections(prev => ({
                                            ...prev,
                                            [groupKey]: !prev[groupKey]
                                        }))}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            backgroundColor: '#f8f9fa',
                                            border: 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#333' }}>
                                                {group.label}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#666',
                                                backgroundColor: '#e0e0e0',
                                                padding: '2px 8px',
                                                borderRadius: '10px'
                                            }}>
                                                {completedCount}/{group.items.length}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '1rem', color: '#999' }}>
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div style={{ padding: '12px' }}>
                                            {group.items.map(item => {
                                                const key = `${item.vaccineId}_${item.dose}`;
                                                const isCompleted = vaccinationRecords[key]?.completed;
                                                const completedDate = vaccinationRecords[key]?.completedDate;

                                                return (
                                                    <div key={key} style={{
                                                        backgroundColor: isCompleted ? '#f8f9fa' : 'white',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${isCompleted ? '#e0e0e0' : '#f0f0f0'}`,
                                                        marginBottom: '8px',
                                                        opacity: isCompleted ? 0.7 : 1
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isCompleted}
                                                                        onChange={() => handleToggle(item.vaccineId, item.dose)}
                                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                                    />
                                                                    <span style={{
                                                                        fontSize: '0.9rem',
                                                                        fontWeight: 'bold',
                                                                        color: isCompleted ? '#999' : '#333',
                                                                        textDecoration: isCompleted ? 'line-through' : 'none'
                                                                    }}>
                                                                        {item.vaccineName} {item.dose}차
                                                                    </span>
                                                                </div>
                                                                <div style={{ marginLeft: '26px' }}>
                                                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 2px 0' }}>
                                                                        {item.ageLabel}
                                                                    </p>
                                                                    {item.note && (
                                                                        <p style={{ fontSize: '0.7rem', color: '#999', margin: '2px 0', fontStyle: 'italic' }}>
                                                                            * {item.note}
                                                                        </p>
                                                                    )}
                                                                    {isCompleted && completedDate && (
                                                                        <p style={{ fontSize: '0.75rem', color: '#4CAF50', margin: '4px 0 0 0' }}>
                                                                            ✓ {completedDate} 완료
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* 안내 문구 */}
            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                fontSize: '0.8rem',
                color: '#666',
                lineHeight: '1.6',
                border: '1px solid #eee'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                    💡 안내사항
                </div>
                <div>
                    • 본 정보는 질병관리청 표준 예방접종 일정을 참고한 것입니다.<br />
                    • 정확한 접종 일정과 방법은 소아청소년과 전문의와 상담하세요.<br />
                    • 백신 종류에 따라 접종 횟수가 다를 수 있습니다.
                </div>
            </div>
        </div>
    );
};

export default VaccinationTracker;
