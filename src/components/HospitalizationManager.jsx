import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';

const HospitalizationManager = ({ childId }) => {
    const [records, setRecords] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        admissionDate: '',
        dischargeDate: '',
        hospital: '',
        department: '',
        doctor: '',
        diagnosis: '',
        symptoms: '',
        treatment: '',
        medications: '',
        followUp: '',
        notes: ''
    });

    useEffect(() => {
        loadRecords();
    }, [childId]);

    const loadRecords = () => {
        const data = DataService.getHospitalizations(childId);
        setRecords(data.sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate)));
    };

    const calculateDuration = (admission, discharge) => {
        if (!admission || !discharge) return 0;
        const diff = new Date(discharge) - new Date(admission);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const duration = calculateDuration(formData.admissionDate, formData.dischargeDate);

        const record = {
            category: 'hospitalization',
            ...formData,
            duration,
            symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean),
            medications: formData.medications.split(',').map(s => s.trim()).filter(Boolean)
        };

        if (editingId) {
            DataService.updateHealthRecord(childId, editingId, record);
        } else {
            DataService.addHealthRecord(childId, record);
        }

        resetForm();
        loadRecords();
    };

    const handleEdit = (record) => {
        setFormData({
            admissionDate: record.admissionDate || '',
            dischargeDate: record.dischargeDate || '',
            hospital: record.hospital || '',
            department: record.department || '',
            doctor: record.doctor || '',
            diagnosis: record.diagnosis || '',
            symptoms: Array.isArray(record.symptoms) ? record.symptoms.join(', ') : '',
            treatment: record.treatment || '',
            medications: Array.isArray(record.medications) ? record.medications.join(', ') : '',
            followUp: record.followUp || '',
            notes: record.notes || ''
        });
        setEditingId(record.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('정말로 이 입원 기록을 삭제하시겠습니까?')) {
            DataService.deleteHealthRecord(childId, id);
            loadRecords();
        }
    };

    const resetForm = () => {
        setFormData({
            admissionDate: '',
            dischargeDate: '',
            hospital: '',
            department: '',
            doctor: '',
            diagnosis: '',
            symptoms: '',
            treatment: '',
            medications: '',
            followUp: '',
            notes: ''
        });
        setEditingId(null);
        setShowForm(false);
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
                    🏥 입원 기록 ({records.length})
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
                    {showForm ? '취소' : '+ 입원 기록 추가'}
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
                        {editingId ? '입원 기록 수정' : '새 입원 기록 추가'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                입원일 *
                            </label>
                            <input
                                type="date"
                                value={formData.admissionDate}
                                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
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
                                퇴원일 *
                            </label>
                            <input
                                type="date"
                                value={formData.dischargeDate}
                                onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
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

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            진단명 *
                        </label>
                        <input
                            type="text"
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            placeholder="예: 폐렴, 장염"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                                placeholder="서울대병원"
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
                                진료과
                            </label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="소아과"
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
                                placeholder="김소아"
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
                            주요 증상 (쉼표로 구분)
                        </label>
                        <input
                            type="text"
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            placeholder="예: 고열, 기침, 호흡곤란"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            치료 내용
                        </label>
                        <textarea
                            value={formData.treatment}
                            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                            placeholder="예: 항생제 정맥주사, 산소치료"
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

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            사용 약물 (쉼표로 구분)
                        </label>
                        <input
                            type="text"
                            value={formData.medications}
                            onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                            placeholder="예: 세프트리악손, 타이레놀"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            퇴원 후 관리사항
                        </label>
                        <textarea
                            value={formData.followUp}
                            onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                            placeholder="예: 2주간 경구 항생제 복용, 충분한 휴식"
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

            {records.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏥</div>
                    <p style={{ fontSize: '1rem', marginBottom: '8px' }}>등록된 입원 기록이 없습니다</p>
                    <p style={{ fontSize: '0.85rem' }}>입원 기록을 추가하여 건강 이력을 관리하세요</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {records.map(record => (
                        <div
                            key={record.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                borderLeft: '4px solid #E53E3E'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🏥</span>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                            {record.diagnosis}
                                        </h3>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>
                                        📅 {record.admissionDate} ~ {record.dischargeDate} ({record.duration}일)
                                    </div>
                                    {record.hospital && (
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            🏥 {record.hospital} {record.department && `· ${record.department}`}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => handleEdit(record)}
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
                                        onClick={() => handleDelete(record.id)}
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

                            {record.symptoms && record.symptoms.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>증상: </span>
                                    <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                        {record.symptoms.join(', ')}
                                    </span>
                                </div>
                            )}

                            {record.treatment && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>치료: </span>
                                    <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                        {record.treatment}
                                    </span>
                                </div>
                            )}

                            {record.medications && record.medications.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>약물: </span>
                                    <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                        {record.medications.join(', ')}
                                    </span>
                                </div>
                            )}

                            {record.followUp && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px',
                                    backgroundColor: '#FFF9E6',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    lineHeight: '1.5'
                                }}>
                                    <strong>퇴원 후 관리:</strong> {record.followUp}
                                </div>
                            )}

                            {record.notes && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    lineHeight: '1.5'
                                }}>
                                    {record.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalizationManager;
