import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import GrowthService from '../services/GrowthService';
import DataService from '../services/DataService';

const GrowthTracker = ({ childId, child: childProp }) => {
    const [child, setChild] = useState(null);
    const [history, setHistory] = useState([]);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activeType, setActiveType] = useState('HEIGHT'); // HEIGHT or WEIGHT

    useEffect(() => {
        // Use the child prop passed from parent
        if (childProp) {
            setChild(childProp);
            const savedHistory = DataService.getGrowthHistory(childId || childProp.id);
            setHistory(savedHistory);
        } else {
            // Fallback: try to get from DataService
            const currentChild = DataService.getChildInfo(childId);
            if (currentChild) {
                setChild(currentChild);
                const savedHistory = DataService.getGrowthHistory(childId || currentChild.id);
                setHistory(savedHistory);
            }
        }
    }, [childId, childProp]);

    const handleSave = async () => {
        if (!height && !weight) return;

        const now = new Date();
        const birth = new Date(child.birthDate);
        const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30.44));

        const entry = {
            months,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            date: now.toISOString()
        };

        const updatedHistory = await DataService.saveGrowthEntry(entry);
        setHistory(updatedHistory);
        setHeight('');
        setWeight('');
    };

    const handleDelete = async (id) => {
        console.log('🔴 GrowthTracker handleDelete 시작:', { id, childId, childFromState: child?.id });
        if (window.confirm('성장 기록을 삭제하시겠습니까?')) {
            console.log('✅ 사용자가 삭제 확인함');
            const updatedHistory = await DataService.deleteGrowthEntry(id, childId || child?.id);
            console.log('📥 DataService에서 받은 새 성장 기록:', updatedHistory.length + '개');
            setHistory(updatedHistory);
            console.log('✨ setHistory 완료');
        } else {
            console.log('❌ 사용자가 삭제 취소함');
        }
    };

    // 차트 데이터 준비
    const chartData = [];
    if (child) {
        for (let i = 0; i <= 60; i += 6) {
            const std = GrowthService.getStandardValues(child.gender || 'male', i, activeType);
            const entry = {
                months: i,
                p3: parseFloat(std.p3.toFixed(1)),
                p50: parseFloat(std.p50.toFixed(1)),
                p97: parseFloat(std.p97.toFixed(1)),
                label: `${i}m`
            };

            // 해당 월령에 기록이 있으면 추가
            const record = history.find(h => h.months === i);
            if (record) {
                entry.value = activeType === 'HEIGHT' ? record.height : record.weight;
            }
            chartData.push(entry);
        }

        // 현재 기록들도 포인트로 추가 (중간 월령들)
        history.forEach(h => {
            if (!chartData.find(cd => cd.months === h.months)) {
                const std = GrowthService.getStandardValues(child.gender || 'male', h.months, activeType);
                chartData.push({
                    months: h.months,
                    p3: parseFloat(std.p3.toFixed(1)),
                    p50: parseFloat(std.p50.toFixed(1)),
                    p97: parseFloat(std.p97.toFixed(1)),
                    value: activeType === 'HEIGHT' ? h.height : h.weight,
                    label: `${h.months}m`
                });
            } else {
                const existing = chartData.find(cd => cd.months === h.months);
                existing.value = activeType === 'HEIGHT' ? h.height : h.weight;
            }
        });
        chartData.sort((a, b) => a.months - b.months);
    }

    const currentStats = history.length > 0 ? history[history.length - 1] : null;
    const currentStandards = child && currentStats ? GrowthService.getStandardValues(child.gender || 'male', currentStats.months, activeType) : null;
    const currentVal = currentStats ? (activeType === 'HEIGHT' ? currentStats.height : currentStats.weight) : null;
    const percentile = currentVal && currentStandards ? GrowthService.calculatePercentile(currentVal, currentStandards) : '-';

    // Safety check: don't render if child data is not available
    if (!child) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ color: '#999' }}>아이 정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '10px' }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                marginBottom: '20px'
            }}>
                <h3 style={{ color: 'var(--primary-dark)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📈 우리 아이 성장 기록
                </h3>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>키 (cm)</label>
                        <input
                            type="number"
                            value={height}
                            onChange={e => setHeight(e.target.value)}
                            placeholder="예: 65.5"
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #eee', outline: 'none' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>몸무게 (kg)</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={e => setWeight(e.target.value)}
                            placeholder="예: 7.2"
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #eee', outline: 'none' }}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        저장
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={() => setActiveType('HEIGHT')}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: activeType === 'HEIGHT' ? '#E3F2FD' : '#f5f5f5', color: activeType === 'HEIGHT' ? '#1976D2' : '#666', fontWeight: 'bold' }}
                    >
                        키 성장곡선
                    </button>
                    <button
                        onClick={() => setActiveType('WEIGHT')}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: activeType === 'WEIGHT' ? '#FFF5F5' : '#f5f5f5', color: activeType === 'WEIGHT' ? '#E53E3E' : '#666', fontWeight: 'bold' }}
                    >
                        몸무게 성장곡선
                    </button>
                </div>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="p97" stroke="#FFCDD2" strokeDasharray="5 5" dot={false} name="상위 3%" />
                            <Line type="monotone" dataKey="p50" stroke="#BBDEFB" strokeWidth={2} dot={false} name="평균" />
                            <Line type="monotone" dataKey="p3" stroke="#FFCDD2" strokeDasharray="5 5" dot={false} name="하위 3%" />
                            <Line type="monotone" dataKey="value" stroke="var(--primary-dark)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-dark)' }} name="우리 아이" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {currentVal && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>최근 기록 (약 {currentStats.months}개월)</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                {currentVal}{activeType === 'HEIGHT' ? 'cm' : 'kg'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>백분위 (또래 100명 중)</span>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                {percentile}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 성장 기록 목록 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                marginBottom: '20px'
            }}>
                <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1rem' }}>📜 기록 목록</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...history].reverse().map(entry => (
                        <div key={entry.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 15px',
                            backgroundColor: '#fcfcfc',
                            borderRadius: '12px',
                            border: '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                                    {entry.months}개월
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#444' }}>
                                    {entry.height ? `${entry.height}cm` : '-'} / {entry.weight ? `${entry.weight}kg` : '-'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                    {new Date(entry.date).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(entry.id);
                                }}
                                style={{
                                    border: '1px solid #ffa39e',
                                    background: '#fff1f0',
                                    color: '#ff4d4f',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    zIndex: 10,
                                    position: 'relative'
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem', padding: '10px 0' }}>
                            아직 기록이 없습니다.
                        </p>
                    )}
                </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', lineHeight: '1.4' }}>
                * 본 차트는 WHO(세계보건기구) 아동 성장 표준 데이터를 기반으로 합니다.<br />
                * 백분위는 또래 100명 중 우리 아이가 몇 번째로 큰지를 의미합니다.
            </div>
        </div>
    );
};

export default GrowthTracker;
