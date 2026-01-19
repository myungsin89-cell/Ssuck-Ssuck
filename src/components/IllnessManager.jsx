import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';

const IllnessManager = ({ childId }) => {
    const [illnesses, setIllnesses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        type: 'fever', // fever, respiratory, skin, digestive, infection
        name: '',
        date: '',
        temperature: '',
        duration: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        hospital: '',
        wasHospitalized: false, // 입원 여부
        hospitalizationDays: '', // 입원 기간
        recovered: true,
        notes: ''
    });

    const illnessTypes = [
        { id: 'fever', label: '고열', icon: '🌡️' },
        { id: 'respiratory', label: '호흡기', icon: '🫁' },
        { id: 'skin', label: '피부', icon: '🔴' },
        { id: 'digestive', label: '소화기', icon: '🤢' },
        { id: 'infection', label: '감염', icon: '🦠' }
    ];

    useEffect(() => {
        loadIllnesses();
    }, [childId]);

    const loadIllnesses = () => {
        const data = DataService.getIllnesses(childId);
        setIllnesses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const record = {
            category: 'illness',
            ...formData,
            symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean),
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            duration: formData.duration ? parseInt(formData.duration) : null
        };

        if (editingId) {
            DataService.updateHealthRecord(childId, editingId, record);
        } else {
            DataService.addHealthRecord(childId, record);
        }

        resetForm();
        loadIllnesses();
    };

    const handleEdit = (illness) => {
        setFormData({
            type: illness.type,
            name: illness.name || '',
            date: illness.date || '',
            temperature: illness.temperature || '',
            duration: illness.duration || '',
            symptoms: Array.isArray(illness.symptoms) ? illness.symptoms.join(', ') : '',
            diagnosis: illness.diagnosis || '',
            treatment: illness.treatment || '',
            hospital: illness.hospital || '',
            wasHospitalized: illness.wasHospitalized || false,
            hospitalizationDays: illness.hospitalizationDays || '',
            recovered: illness.recovered !== false,
            notes: illness.notes || ''
        });
        setEditingId(illness.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('정말로 이 질병 이력을 삭제하시겠습니까?')) {
            DataService.deleteHealthRecord(childId, id);
            loadIllnesses();
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'fever',
            name: '',
            date: '',
            temperature: '',
            duration: '',
            symptoms: '',
            diagnosis: '',
            treatment: '',
            hospital: '',
            wasHospitalized: false,
            hospitalizationDays: '',
            recovered: true,
            notes: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const getTypeInfo = (type) => {
        return illnessTypes.find(t => t.id === type) || illnessTypes[0];
    };

    return (
        <div>
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
                    🦠 질병 이력 ({illnesses.length})
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
                        cursor: 'pointer'
                    }}
                >
                    {showForm ? '취소' : '+ 질병 이력 추가'}
                </button>
            </div>

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
                        {editingId ? '질병 이력 수정' : '새 질병 이력 추가'}
                    </h3>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            질병 유형 *
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
                            {illnessTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                질병명 *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="예: 폐렴, 두드러기"
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
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                발생일 *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    </div>

                    {formData.type === 'fever' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    marginBottom: '6px',
                                    fontWeight: '500'
                                }}>
                                    최고 체온 (°C)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.temperature}
                                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                    placeholder="39.5"
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
                                    지속 기간 (일)
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="3"
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
                    )}

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
                            placeholder="예: 기침, 가래, 호흡곤란"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                진단명
                            </label>
                            <input
                                type="text"
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                placeholder="예: 바이러스성 감염"
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
                                병원
                            </label>
                            <input
                                type="text"
                                value={formData.hospital}
                                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                placeholder="예: 동네 소아과"
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

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            치료 방법
                        </label>
                        <input
                            type="text"
                            value={formData.treatment}
                            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                            placeholder="예: 해열제 복용, 수분 섭취"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* 입원 여부 */}
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            marginBottom: formData.wasHospitalized ? '12px' : '0'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.wasHospitalized}
                                onChange={(e) => setFormData({ ...formData, wasHospitalized: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.95rem', color: '#333', fontWeight: '500' }}>🏥 입원 치료 받음</span>
                        </label>

                        {formData.wasHospitalized && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    marginBottom: '6px',
                                    fontWeight: '500'
                                }}>
                                    입원 기간 (일)
                                </label>
                                <input
                                    type="number"
                                    value={formData.hospitalizationDays}
                                    onChange={(e) => setFormData({ ...formData, hospitalizationDays: e.target.value })}
                                    placeholder="5"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.recovered}
                                onChange={(e) => setFormData({ ...formData, recovered: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#333' }}>회복 완료</span>
                        </label>
                    </div>

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
                            placeholder="추가 정보나 주의사항"
                            rows={2}
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

            {illnesses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🦠</div>
                    <p style={{ fontSize: '1rem', marginBottom: '8px' }}>등록된 질병 이력이 없습니다</p>
                    <p style={{ fontSize: '0.85rem' }}>질병 이력을 추가하여 건강 관리를 시작하세요</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {illnesses.map(illness => {
                        const typeInfo = getTypeInfo(illness.type);
                        return (
                            <div
                                key={illness.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    borderLeft: `4px solid ${illness.recovered ? '#10B981' : '#F59E0B'}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                                {illness.name}
                                            </h3>
                                            {illness.recovered && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: '#D1FAE5',
                                                    color: '#059669',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    회복
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
                                            📅 {illness.date}
                                            {illness.temperature && ` · 🌡️ ${illness.temperature}°C`}
                                            {illness.duration && ` · ⏱️ ${illness.duration}일`}
                                        </div>
                                        {illness.wasHospitalized && (
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                backgroundColor: '#FEE',
                                                color: '#E53E3E',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                marginRight: '6px',
                                                marginBottom: '6px'
                                            }}>
                                                🏥 입원 {illness.hospitalizationDays}일
                                            </div>
                                        )}
                                        <span style={{
                                            padding: '4px 10px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            color: '#666'
                                        }}>
                                            {typeInfo.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => handleEdit(illness)}
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
                                            onClick={() => handleDelete(illness.id)}
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

                                {illness.symptoms && illness.symptoms.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>증상: </span>
                                        <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                            {illness.symptoms.join(', ')}
                                        </span>
                                    </div>
                                )}

                                {illness.diagnosis && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>진단: </span>
                                        <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                            {illness.diagnosis}
                                        </span>
                                    </div>
                                )}

                                {illness.treatment && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>치료: </span>
                                        <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                            {illness.treatment}
                                        </span>
                                    </div>
                                )}

                                {illness.notes && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '10px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: '#666',
                                        lineHeight: '1.5'
                                    }}>
                                        {illness.notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default IllnessManager;
