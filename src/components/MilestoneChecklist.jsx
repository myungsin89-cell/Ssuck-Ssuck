import { useState, useEffect } from 'react';
import MilestoneService from '../services/MilestoneService';
import DataService from '../services/DataService';

const MilestoneChecklist = ({ currentAgeMonths }) => {
    const [milestones, setMilestones] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState(DataService.getCheckedItems());

    useEffect(() => {
        const loadMilestones = async () => {
            setLoading(true);
            try {
                // 가장 가까운 월령 데이터 찾기 (예: 2개월, 4개월, 6개월)
                // 실제로는 더 정교한 로직이 필요할 수 있음
                let targetAge = '2_months';
                if (currentAgeMonths >= 4) targetAge = '4_months';
                if (currentAgeMonths >= 6) targetAge = '6_months';
                // 9개월, 12개월 등 추가 필요

                const data = await MilestoneService.getMilestonesByAge(targetAge);
                setMilestones(data);
            } catch (error) {
                console.error("Failed to load milestones", error);
            } finally {
                setLoading(false);
            }
        };

        loadMilestones();
    }, [currentAgeMonths]);

    const toggleCheck = (id) => {
        const isChecked = !checkedItems[id];
        const newItems = DataService.toggleChecklist(id, isChecked);
        setCheckedItems({ ...newItems });
    };

    if (loading) return <div>로딩 중...</div>;
    if (!milestones) return <div>데이터가 없습니다.</div>;

    return (
        <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary-dark)' }}>
                {milestones.age_label} 발달 체크리스트
            </h3>

            {milestones.categories.map(category => (
                <div key={category.id} style={{ marginBottom: '20px' }}>
                    <h4 style={{
                        fontSize: '1rem',
                        color: 'var(--text-main)',
                        marginBottom: '10px',
                        borderBottom: '2px solid var(--secondary-color)',
                        display: 'inline-block',
                        paddingBottom: '2px'
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
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={!!checkedItems[item.id]}
                                    onChange={() => toggleCheck(item.id)}
                                    style={{
                                        marginTop: '4px',
                                        marginRight: '12px',
                                        accentColor: 'var(--primary-color)',
                                        transform: 'scale(1.2)'
                                    }}
                                />
                                <span style={{
                                    fontSize: '0.95rem',
                                    color: checkedItems[item.id] ? '#aaa' : 'var(--text-main)',
                                    textDecoration: checkedItems[item.id] ? 'line-through' : 'none'
                                }}>
                                    {item.text}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MilestoneChecklist;
