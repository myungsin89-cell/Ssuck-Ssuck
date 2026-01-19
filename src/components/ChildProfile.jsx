import { useState, useEffect } from 'react';
import MilestoneService from '../services/MilestoneService';
import DataService from '../services/DataService';
import ChildRegistration from './ChildRegistration';


const ChildProfile = ({ child, onAgeChange, onSwitchChild, onUpdateChild }) => {
    const [ageMonths, setAgeMonths] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (child && child.birthDate) {
            const months = MilestoneService.calculateAgeInMonths(child.birthDate);
            setAgeMonths(months);
            if (onAgeChange) {
                onAgeChange(months);
            }
        }
    }, [child?.birthDate, onAgeChange]);

    const calculateAgeDisplay = () => {
        if (!child || !child.birthDate) return '';

        const birth = new Date(child.birthDate);
        const today = new Date();

        // Calculate total months (using the same logic as MilestoneService for consistency)
        const totalMonths = MilestoneService.calculateAgeInMonths(child.birthDate);

        // Calculate remaining days after full months
        const birthDay = birth.getDate();
        const currentDay = today.getDate();

        let remainingDays = 0;
        if (currentDay >= birthDay) {
            remainingDays = currentDay - birthDay;
        } else {
            // Previous month's end date
            const prevMonthLastDate = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            remainingDays = prevMonthLastDate - birthDay + currentDay;
        }

        return `${totalMonths}개월 ${remainingDays}일`;
    };

    if (!child) return null;

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: 'white',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow-soft)',
                    marginBottom: '20px',
                    position: 'relative'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <img
                            src={child.photoUrl || 'https://via.placeholder.com/60'}
                            alt={child.name}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                marginRight: '16px',
                                backgroundColor: '#f0f0f0',
                                objectFit: 'cover',
                                border: '2px solid var(--secondary-color)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            bottom: '-2px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            border: '1px solid #ddd'
                        }}>
                            ✏️
                        </div>
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: '1.1rem',
                            marginBottom: '4px',
                            fontWeight: '700',
                            color: 'var(--primary-dark)'
                        }}>
                            {child.name}
                            <span style={{
                                marginLeft: '6px',
                                fontSize: '1.1rem',
                                color: child.gender === 'female' ? '#e03131' : '#1971c2',
                                verticalAlign: 'middle'
                            }}>
                                {child.gender === 'female' ? '♀' : '♂'}
                            </span>
                        </h2>
                        <p style={{
                            color: 'var(--text-sub)',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                        }}>
                            생후 {calculateAgeDisplay()}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onSwitchChild}
                    title="다른 아이 보기"
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#718096',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EDF2F7';
                        e.currentTarget.style.color = 'var(--primary-color)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#718096';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 12 12)" />
                    </svg>
                </button>
            </div>



            {/* 수정 모달 */}
            <ChildRegistration
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={child}
                onSave={onUpdateChild}
            />
        </>
    );
};

export default ChildProfile;
