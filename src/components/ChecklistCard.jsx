import { useState } from 'react';
import ProgressService from '../services/ProgressService';

const ChecklistCard = ({ currentAgeMonths, ageLabel, progress, onClick }) => {
    const progressColor = ProgressService.getProgressColor(progress.percentage);

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                marginBottom: '20px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '2px solid #f0f0f0'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-dark)',
                    margin: 0
                }}>
                    ✅ {ageLabel} 발달 체크리스트
                </h3>
                <span style={{ fontSize: '1.5rem', color: '#999' }}>›</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
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
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: progressColor
                    }}>
                        {progress.percentage}%
                    </span>
                </div>

                {/* 진행률 바 */}
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

            <p style={{
                fontSize: '0.85rem',
                color: '#999',
                margin: 0,
                marginTop: '8px'
            }}>
                탭하여 체크리스트 작성하기
            </p>
        </div>
    );
};

export default ChecklistCard;
