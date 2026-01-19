import React, { useState, useEffect, useRef } from 'react';
import GeminiService from '../services/GeminiService';
import DataService from '../services/DataService';
import MilestoneService from '../services/MilestoneService';
import ProgressService from '../services/ProgressService';

const ParentingChat = ({ childId, child: childProp }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [contextData, setContextData] = useState(null);

    useEffect(() => {
        const loadContextData = async () => {
            console.log('🔍 ParentingChat loadContextData called', { childId, childProp });

            // Use the child prop passed from parent
            let currentChild = childProp;

            if (!currentChild) {
                // Fallback: try to get from DataService
                currentChild = DataService.getChildInfo(childId);
                console.log('📥 Fetched from DataService:', currentChild);
            } else {
                console.log('✅ Using childProp:', currentChild);
            }

            if (!currentChild) {
                console.log('❌ No child data available');
                setContextData(null);
                setMessages([]);
                return;
            }

            // 아이의 현재 월령 계산
            const birthDate = new Date(currentChild.birthDate);
            const today = new Date();
            let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
            ageMonths -= birthDate.getMonth();
            ageMonths += today.getMonth();
            if (today.getDate() < birthDate.getDate()) {
                ageMonths--;
            }
            ageMonths = Math.max(0, ageMonths);

            // 월령 라벨 생성
            const years = Math.floor(ageMonths / 12);
            const months = ageMonths % 12;
            let ageLabel = '';
            if (years > 0) {
                ageLabel = `만 ${years}세`;
                if (months > 0) ageLabel += ` ${months}개월`;
            } else {
                ageLabel = `${months}개월`;
            }

            // child 객체에 월령 정보 추가
            const enrichedChild = {
                ...currentChild,
                ageMonths,
                ageLabel
            };

            // 관찰 일기 (최근 5개)
            const allLogs = DataService.getLogs(childId);
            const recentLogs = allLogs.slice(0, 5);

            // 성장 기록 (최근 3개)
            const growthHistory = DataService.getGrowthHistory(childId);
            const recentGrowth = growthHistory.slice(-3);

            // 발달 정보 및 체크리스트 진행률
            const milestones = await MilestoneService.getMilestonesByAge(ageMonths);
            const checkedItems = DataService.getCheckedItems(childId);
            const progress = ProgressService.calculateProgress(checkedItems, milestones);

            setContextData({
                child: enrichedChild,
                recentLogs,
                recentGrowth,
                milestones,
                progress
            });

            // 아이가 바뀌면 메시지 초기화 및 환영 인사
            const childName = enrichedChild.name || '아이';
            const welcomeMessage = {
                id: 'welcome',
                text: `안녕하세요! 🧚 ${childName}(${enrichedChild.ageLabel}) 담당 쑥쑥 선생님이에요. 궁금한 점 편하게 물어보세요! 😊`,
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            console.log('💬 Setting welcome message:', welcomeMessage);
            setMessages([welcomeMessage]);
        };

        loadContextData();
    }, [childId, childProp]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = {
            id: Date.now(),
            text: input,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // 통합된 컨텍스트 데이터를 AI에게 전달
        const aiResponseText = await GeminiService.sendMessage(input, contextData);

        const aiMsg = {
            id: Date.now() + 1,
            text: aiResponseText,
            sender: 'ai',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 180px)',
            backgroundColor: '#AFCCFF', // 카톡 배경 느낌
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
            {/* 채팅창 헤더 */}
            <div style={{
                padding: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                borderBottom: '1px solid #eee'
            }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>🧚 쑥쑥 상담소</span>
            </div>

            {/* 메시지 리스트 */}
            <div style={{
                flex: 1,
                padding: '15px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: '8px'
                        }}
                    >
                        {msg.sender === 'ai' && (
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                alignSelf: 'flex-start'
                            }}>
                                🧚
                            </div>
                        )}
                        <div style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: msg.sender === 'user' ? '18px 2px 18px 18px' : '2px 18px 18px 18px',
                            backgroundColor: msg.sender === 'user' ? '#FEE500' : 'white',
                            color: '#3C1E1E',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.text}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#666', marginBottom: '4px' }}>
                            {msg.time}
                        </span>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧚</div>
                        <div style={{ padding: '10px 14px', borderRadius: '2px 18px 18px 18px', backgroundColor: 'white', display: 'flex', gap: '4px' }}>
                            <div className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                            <div className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
                            <div className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div style={{
                padding: '10px',
                backgroundColor: 'white',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="쑥쑥 선생님께 물어보세요..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '20px',
                        border: '1px solid #eee',
                        backgroundColor: '#f9f9f9',
                        fontSize: '0.95rem',
                        resize: 'none',
                        outline: 'none',
                        height: '45px',
                        maxHeight: '100px'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: input.trim() ? '#FEE500' : '#eee',
                        color: '#3C1E1E',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    전송
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};

export default ParentingChat;
