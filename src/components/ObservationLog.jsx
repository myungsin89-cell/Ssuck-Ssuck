import { useState, useEffect, useCallback } from 'react';
import DataService from '../services/DataService';
import MilestoneService from '../services/MilestoneService';
import ProgressService from '../services/ProgressService';
import GeminiService from '../services/GeminiService';
import { groupLogsByAge } from '../utils/logUtils';

const ObservationLog = ({ childId, currentAgeMonths = 0 }) => {
    const [logText, setLogText] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        setLogs(DataService.getLogs(childId));
    }, [childId]);

    // AI 분석 디바운싱
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (logText.trim().length > 5) {
                setIsAnalyzing(true);
                try {
                    // 전체 데이터 대신 현재 월령 기준 필터링된 데이터만 전송 (부하 감소 및 정확도 향상)
                    const relevantMilestones = await MilestoneService.getMilestonesByRange(currentAgeMonths);
                    const result = await GeminiService.analyzeObservation(logText, currentAgeMonths, relevantMilestones);
                    setAiAnalysis(result.isMatched ? result : null);
                } catch (err) {
                    console.error("AI Analysis failed", err);
                } finally {
                    setIsAnalyzing(false);
                }
            } else {
                setAiAnalysis(null);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [logText, currentAgeMonths]);

    const handleLogChange = (e) => {
        setLogText(e.target.value);
    };

    // 카테고리별 아이콘 매핑
    const getCategoryIcon = (categoryId) => {
        const icons = {
            social: '👥',
            language: '🗣️',
            cognitive: '🧠',
            physical: '🏃',
            movement: '💪',
            sensory: '👂'
        };
        return icons[categoryId] || '💡';
    };

    const handleSave = async () => {
        if (!logText.trim()) return;

        const newLogs = await DataService.saveLog({
            text: logText,
            aiAnalysis: aiAnalysis
        });

        setLogs(newLogs);
        setLogText('');
        setAiAnalysis(null);
    };

    const handleDelete = async (id) => {
        console.log('🔴 ObservationLog handleDelete 시작:', { id, childId });
        if (window.confirm('기록을 삭제하시겠습니까?')) {
            console.log('✅ 사용자가 삭제 확인함');
            const newLogs = await DataService.deleteLog(id, childId);
            console.log('📥 DataService에서 받은 새 로그:', newLogs.length + '개');
            setLogs(newLogs);
            console.log('✨ setLogs 완료');
        } else {
            console.log('❌ 사용자가 삭제 취소함');
        }
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary-dark)' }}>
                관찰 일기 📝
            </h3>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: 'var(--border-radius)',
                boxShadow: 'var(--shadow-soft)',
                position: 'relative'
            }}>
                <textarea
                    value={logText}
                    onChange={handleLogChange}
                    placeholder="오늘 아이의 행동을 자유롭게 기록해주세요..."
                    style={{
                        width: '100%',
                        height: '100px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        resize: 'none',
                        fontSize: '1rem',
                        marginBottom: '10px',
                        fontFamily: 'inherit'
                    }}
                />


                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        {isAnalyzing && <span className="fade-in">🧠 AI가 문맥을 분석하고 있어요...</span>}
                    </div>
                    <button
                        onClick={handleSave}
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        저장하기
                    </button>
                </div>

                {/* AI 분석 결과 표시 (우선순위 높음) */}
                {aiAnalysis && (
                    <div style={{
                        marginTop: '15px',
                        backgroundColor: aiAnalysis.matchedAge > currentAgeMonths ? '#FFF9DB' : '#F0F9EB',
                        padding: '16px',
                        borderRadius: '12px',
                        border: aiAnalysis.matchedAge > currentAgeMonths ? '2px solid #FAB005' : '1px solid #E1F3D8',
                        animation: aiAnalysis.matchedAge > currentAgeMonths ? 'bounce 0.5s ease-in-out' : 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>
                                {aiAnalysis.matchedAge > currentAgeMonths ? '✨' : getCategoryIcon(aiAnalysis.categoryId)}
                            </span>
                            <h4 style={{ fontSize: '1rem', color: aiAnalysis.matchedAge > currentAgeMonths ? '#E67700' : '#2B8A3E', margin: 0 }}>
                                {aiAnalysis.matchedAge > currentAgeMonths ? '와! 우리 아이 성장이 정말 빨라요!' : 'AI 발달 분석 결과'}
                            </h4>
                        </div>
                        <p style={{ fontSize: '0.95rem', margin: '0 0 8px 0', lineHeight: '1.6', color: '#444' }}>
                            작성하신 내용은 <strong style={{ color: '#1890ff' }}>[{aiAnalysis.matchedAgeLabel}]</strong> 발달 단계인
                            <strong> "{aiAnalysis.milestoneText}"</strong>에 해당해요.
                        </p>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.6)',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#555',
                            lineHeight: '1.5',
                            borderLeft: '4px solid ' + (aiAnalysis.matchedAge > currentAgeMonths ? '#FAB005' : '#74C0FC')
                        }}>
                            🧚 <strong>쑥쑥 선생님의 조언:</strong> {aiAnalysis.comment}
                        </div>
                    </div>
                )}

            </div>
            {/* 이전 기록들 */}
            <h3 style={{ marginTop: '40px', marginBottom: '20px', color: 'var(--primary-dark)' }}>
                이전 기록들 📜
            </h3>

            {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                    아직 기록이 없습니다. 아이의 성장을 기록해보세요!
                </p>
            ) : (
                groupLogsByAge(logs).map(group => (
                    <div key={group.monthLabel} style={{ marginBottom: '30px' }}>
                        <h4 style={{
                            fontSize: '1.1rem',
                            color: 'var(--primary-color)',
                            borderLeft: '4px solid var(--primary-color)',
                            paddingLeft: '10px',
                            marginBottom: '15px'
                        }}>
                            {group.monthLabel} ({group.logs.length}건)
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {group.logs.map(log => (
                                <div key={log.id} style={{
                                    backgroundColor: 'white',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            color: 'var(--primary-dark)',
                                            backgroundColor: '#E3F2FD',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {log.ageAtRecord?.label || '기록 없음'}
                                        </span>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(log.id);
                                                }}
                                                style={{
                                                    background: '#fff1f0',
                                                    border: '1px solid #ffa39e',
                                                    color: '#ff4d4f',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    zIndex: 10,
                                                    position: 'relative'
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>

                                    <p style={{
                                        margin: '10px 0',
                                        lineHeight: '1.6',
                                        color: 'var(--text-main)',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {log.text}
                                    </p>

                                    {log.aiAnalysis && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px 10px',
                                            backgroundColor: '#f0f7ff',
                                            borderRadius: '6px',
                                            fontSize: '0.85rem',
                                            color: '#1890ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span>{getCategoryIcon(log.aiAnalysis.categoryId)}</span>
                                            <span>{log.aiAnalysis.matchedAgeLabel} - {log.aiAnalysis.milestoneText}</span>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

export default ObservationLog;
