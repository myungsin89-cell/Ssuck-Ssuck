import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';

const AllergyManager = ({ childId }) => {
    const [allergies, setAllergies] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // 폼 데이터
    const [formData, setFormData] = useState({
        type: 'food', // food, drug, environment
        name: '',
        severity: 'medium', // low, medium, high
        symptoms: '',
        firstOccurrence: '',
        hospital: '',
        doctor: '',
        treatment: '',
        notes: ''
    });

    useEffect(() => {
        loadAllergies();
    }, [childId]);

    const loadAllergies = () => {
        const data = DataService.getAllergies(childId);
        setAllergies(data);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const record = {
            category: 'allergy',
            ...formData,
            symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean)
        };

        if (editingId) {
            DataService.updateHealthRecord(childId, editingId, record);
        } else {
            DataService.addHealthRecord(childId, record);
        }

        resetForm();
        loadAllergies();
    };

    const handleEdit = (allergy) => {
        setFormData({
            type: allergy.type,
            name: allergy.name,
            severity: allergy.severity,
            symptoms: allergy.symptoms.join(', '),
            firstOccurrence: allergy.firstOccurrence || '',
            hospital: allergy.hospital || '',
            doctor: allergy.doctor || '',
            treatment: allergy.treatment || '',
            notes: allergy.notes || ''
        });
        setEditingId(allergy.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('정말로 이 알레르기 기록을 삭제하시겠습니까?')) {
            DataService.deleteHealthRecord(childId, id);
            loadAllergies();
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'food',
            name: '',
            severity: 'medium',
            symptoms: '',
            firstOccurrence: '',
            hospital: '',
            doctor: '',
            treatment: '',
            notes: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#E53E3E';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#999';
        }
    };

    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'high': return '높음';
            case 'medium': return '중간';
            case 'low': return '낮음';
            default: return '';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'food': return '🥜';
            case 'drug': return '💊';
            case 'environment': return '🌸';
            default: return '🤧';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'food': return '음식';
            case 'drug': return '약물';
            case 'environment': return '환경';
            default: return '';
        }
    };

    return (
        <div>
            {/* 헤더 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#333'
                }}>
                    🤧 알레르기 ({allergies.length})
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: showForm ? '#f5f5f5' : 'var(--primary-color)',
                        color: showForm ? '#666' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {showForm ? '취소' : '+ 알레르기 추가'}
                </button>
            </div>

            {/* 입력 폼 */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: '16px'
                    }}>
                        {editingId ? '알레르기 수정' : '새 알레르기 추가'}
                    </h3>

                    {/* 알레르기 유형 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            알레르기 유형 *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                            required
                        >
                            <option value="food">🥜 음식 알레르기</option>
                            <option value="drug">💊 약물 알레르기</option>
                            <option value="environment">🌸 환경 알레르기</option>
                        </select>
                    </div>

                    {/* 알레르기 이름 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            알레르기 이름 *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="예: 땅콩, 페니실린, 꽃가루"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                            required
                        />
                    </div>

                    {/* 심각도 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            심각도 *
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['low', 'medium', 'high'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, severity: level })}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: formData.severity === level ? getSeverityColor(level) : '#f5f5f5',
                                        color: formData.severity === level ? 'white' : '#666',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {getSeverityLabel(level)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 증상 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            증상 (쉼표로 구분)
                        </label>
                        <input
                            type="text"
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            placeholder="예: 두드러기, 호흡곤란, 가려움"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* 첫 발생일 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            첫 발생일
                        </label>
                        <input
                            type="date"
                            value={formData.firstOccurrence}
                            onChange={(e) => setFormData({ ...formData, firstOccurrence: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* 병원/의사 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                병원
                            </label>
                            <input
                                type="text"
                                value={formData.hospital}
                                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                placeholder="예: 서울대병원"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                담당의
                            </label>
                            <input
                                type="text"
                                value={formData.doctor}
                                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                placeholder="예: 김소아"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* 치료/처방 */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            치료/처방
                        </label>
                        <input
                            type="text"
                            value={formData.treatment}
                            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                            placeholder="예: 에피펜 처방, 항히스타민제"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* 메모 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            메모
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="추가 정보나 주의사항을 입력하세요"
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {editingId ? '수정하기' : '저장하기'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                    </div>
                </form>
            )}

            {/* 알레르기 목록 */}
            {allergies.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤧</div>
                    <p style={{ fontSize: '1rem', marginBottom: '8px' }}>등록된 알레르기가 없습니다</p>
                    <p style={{ fontSize: '0.85rem' }}>알레르기 정보를 추가하여 건강을 관리하세요</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {allergies.map(allergy => (
                        <div
                            key={allergy.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                borderLeft: `4px solid ${getSeverityColor(allergy.severity)}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(allergy.type)}</span>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                            {allergy.name}
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            color: '#666'
                                        }}>
                                            {getTypeLabel(allergy.type)}
                                        </span>
                                        <span style={{
                                            padding: '4px 10px',
                                            backgroundColor: getSeverityColor(allergy.severity) + '20',
                                            color: getSeverityColor(allergy.severity),
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            심각도: {getSeverityLabel(allergy.severity)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => handleEdit(allergy)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#f5f5f5',
                                            color: '#666',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(allergy.id)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#FFF5F5',
                                            color: '#E53E3E',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>

                            {allergy.symptoms && allergy.symptoms.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>증상: </span>
                                    <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                        {allergy.symptoms.join(', ')}
                                    </span>
                                </div>
                            )}

                            {allergy.treatment && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>치료: </span>
                                    <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                        {allergy.treatment}
                                    </span>
                                </div>
                            )}

                            {allergy.notes && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    lineHeight: '1.5'
                                }}>
                                    {allergy.notes}
                                </div>
                            )}

                            {allergy.firstOccurrence && (
                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#999' }}>
                                    첫 발생: {allergy.firstOccurrence}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllergyManager;
