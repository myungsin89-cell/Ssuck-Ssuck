import React, { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import GeminiService from '../services/GeminiService';

const SupplementManager = ({ childId, child }) => {
    const [supplements, setSupplements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        ingredients: '',
        dosage: '',
        startDate: '',
        purpose: '',
        notes: '',
        imageData: null
    });

    // 월령별 필요 영양 성분 (출처: 보건복지부·한국영양학회 '2020 한국인 영양소 섭취기준', 대한소아청소년과학회)
    const getRequiredNutrients = (ageMonths) => {
        if (ageMonths < 6) {
            // 0-5개월
            return [
                { name: '비타민D', amount: '400 IU/일', reason: '뼈 건강, 면역력', source: '대한소아청소년과학회' },
                { name: '철분', amount: '0.3 mg/일', reason: '빈혈 예방', source: '한국영양학회' },
                { name: '칼슘', amount: '250 mg/일', reason: '뼈 건강', source: '한국영양학회' }
            ];
        } else if (ageMonths < 12) {
            // 6-11개월
            return [
                { name: '비타민D', amount: '400 IU/일', reason: '뼈 건강, 면역력', source: '대한소아청소년과학회' },
                { name: '철분', amount: '6 mg/일', reason: '빈혈 예방, 성장', source: '한국영양학회' },
                { name: 'DHA', amount: '70-100 mg/일', reason: '두뇌 발달', source: '영양학계' },
                { name: '칼슘', amount: '300 mg/일', reason: '뼈 건강', source: '한국영양학회' }
            ];
        } else if (ageMonths < 24) {
            // 12-23개월
            return [
                { name: '비타민D', amount: '600 IU/일', reason: '뼈 건강, 면역력', source: '대한소아청소년과학회' },
                { name: '철분', amount: '7 mg/일', reason: '빈혈 예방, 성장', source: '한국영양학회' },
                { name: 'DHA', amount: '100 mg/일', reason: '두뇌 발달', source: '영양학계' },
                { name: '아연', amount: '3 mg/일', reason: '면역력, 성장', source: '한국영양학회' },
                { name: '칼슘', amount: '500 mg/일', reason: '뼈 건강', source: '한국영양학회' },
                { name: '비타민C', amount: '40 mg/일', reason: '면역력, 철분 흡수', source: '한국영양학회' }
            ];
        } else if (ageMonths < 36) {
            // 24-35개월
            return [
                { name: '비타민D', amount: '600 IU/일', reason: '뼈 건강, 면역력', source: '대한소아청소년과학회' },
                { name: '철분', amount: '7 mg/일', reason: '빈혈 예방, 성장', source: '한국영양학회' },
                { name: 'DHA', amount: '100-150 mg/일', reason: '두뇌 발달', source: '영양학계' },
                { name: '아연', amount: '3 mg/일', reason: '면역력, 성장', source: '한국영양학회' },
                { name: '칼슘', amount: '500 mg/일', reason: '뼈 건강', source: '한국영양학회' },
                { name: '비타민C', amount: '40 mg/일', reason: '면역력, 철분 흡수', source: '한국영양학회' }
            ];
        } else {
            // 36개월 이상
            return [
                { name: '비타민D', amount: '600 IU/일', reason: '뼈 건강, 면역력', source: '대한소아청소년과학회' },
                { name: '철분', amount: '7 mg/일', reason: '빈혈 예방, 성장', source: '한국영양학회' },
                { name: 'DHA', amount: '100-150 mg/일', reason: '두뇌 발달', source: '영양학계' },
                { name: '아연', amount: '3 mg/일', reason: '면역력, 성장', source: '한국영양학회' },
                { name: '칼슘', amount: '600 mg/일', reason: '뼈 건강', source: '한국영양학회' },
                { name: '비타민C', amount: '40 mg/일', reason: '면역력, 철분 흡수', source: '한국영양학회' }
            ];
        }
    };

    const requiredNutrients = getRequiredNutrients(child?.ageMonths || 12);

    useEffect(() => {
        loadSupplements();
    }, [childId]);

    const loadSupplements = () => {
        // 영양제 데이터는 건강 기록의 supplements 카테고리로 저장
        const allRecords = DataService.getHealthRecords(childId);
        const suppData = allRecords.filter(r => r.category === 'supplement');
        setSupplements(suppData);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, imageData: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async () => {
        if (!formData.imageData) {
            alert('영양제 성분표 사진을 먼저 업로드해주세요!');
            return;
        }

        setAnalyzing(true);
        try {
            const prompt = `
이 영양제 성분표를 분석해주세요.

다음 정보를 추출해주세요:
1. 제품명
2. 주요 성분과 함량 (예: 비타민D 400IU, DHA 100mg)
3. 1회 복용량

아이 월령: ${child?.ageMonths || 12}개월
필요한 영양 성분:
${requiredNutrients.map(n => `- ${n.name}: ${n.amount} (${n.reason})`).join('\n')}

분석 결과를 다음 형식으로 JSON으로 반환해주세요:
{
  "productName": "제품명",
  "ingredients": "비타민D 400IU, DHA 100mg, ...",
  "dosage": "1일 1회, 1포",
  "analysis": "이 영양제는 비타민D와 DHA를 충족하지만, 철분이 부족합니다.",
  "recommendation": "추가로 철분 보충을 권장합니다."
}
`;

            const result = await GeminiService.analyzeImage(formData.imageData, prompt);

            // JSON 파싱 시도
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setAnalysisResult(parsed);
                    setFormData({
                        ...formData,
                        name: parsed.productName || formData.name,
                        ingredients: parsed.ingredients || formData.ingredients,
                        dosage: parsed.dosage || formData.dosage
                    });
                } else {
                    setAnalysisResult({ analysis: result });
                }
            } catch (e) {
                setAnalysisResult({ analysis: result });
            }
        } catch (error) {
            alert('이미지 분석 중 오류가 발생했습니다.');
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const record = {
            category: 'supplement',
            ...formData,
            analysisResult
        };

        DataService.addHealthRecord(childId, record);
        resetForm();
        loadSupplements();
    };

    const handleDelete = (id) => {
        if (window.confirm('정말로 이 영양제 기록을 삭제하시겠습니까?')) {
            DataService.deleteHealthRecord(childId, id);
            loadSupplements();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            brand: '',
            ingredients: '',
            dosage: '',
            startDate: '',
            purpose: '',
            notes: '',
            imageData: null
        });
        setAnalysisResult(null);
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
                    💊 영양제 관리 ({supplements.length})
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
                    {showForm ? '취소' : '+ 영양제 추가'}
                </button>
            </div>

            {/* 필요 영양 성분 */}
            <div style={{
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
                    marginBottom: '8px'
                }}>
                    🌟 {child?.name}에게 필요한 영양 성분 ({child?.ageMonths}개월)
                </h3>
                <p style={{
                    fontSize: '0.75rem',
                    color: '#999',
                    marginBottom: '12px'
                }}>
                    출처: 보건복지부·한국영양학회 '2020 한국인 영양소 섭취기준', 대한소아청소년과학회
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {requiredNutrients.map((nutrient, idx) => (
                        <div key={idx} style={{
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#333' }}>{nutrient.name}</span>
                                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                                    {nutrient.reason}
                                </span>
                            </div>
                            <span style={{
                                padding: '4px 10px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {nutrient.amount}
                            </span>
                        </div>
                    ))}
                </div>
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
                        새 영양제 추가
                    </h3>

                    {/* 사진 업로드 */}
                    <div style={{
                        marginBottom: '16px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px dashed #ddd'
                    }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            color: '#333',
                            marginBottom: '12px',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            📸 영양제 성분표 사진 업로드
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                marginBottom: '12px'
                            }}
                        />
                        {formData.imageData && (
                            <div>
                                <img
                                    src={formData.imageData}
                                    alt="영양제 성분표"
                                    style={{
                                        width: '100%',
                                        maxHeight: '200px',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        marginBottom: '12px'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={analyzeImage}
                                    disabled={analyzing}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: analyzing ? '#ccc' : '#10B981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        cursor: analyzing ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {analyzing ? '🔍 분석 중...' : '🤖 AI 성분 분석하기'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI 분석 결과 */}
                    {analysisResult && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: '#E8F5E9',
                            borderRadius: '12px',
                            border: '1px solid #10B981'
                        }}>
                            <h4 style={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: '#059669',
                                marginBottom: '8px'
                            }}>
                                🤖 AI 분석 결과
                            </h4>
                            {analysisResult.analysis && (
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: '#333',
                                    lineHeight: '1.6',
                                    marginBottom: '8px'
                                }}>
                                    {analysisResult.analysis}
                                </p>
                            )}
                            {analysisResult.recommendation && (
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: '#059669',
                                    fontWeight: '500'
                                }}>
                                    💡 {analysisResult.recommendation}
                                </p>
                            )}
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
                            제품명 *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="예: 비타민D 하이디"
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

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            주요 성분
                        </label>
                        <textarea
                            value={formData.ingredients}
                            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                            placeholder="예: 비타민D3 400IU, 비타민K 10mcg"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#666',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                복용량
                            </label>
                            <input
                                type="text"
                                value={formData.dosage}
                                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                placeholder="1일 1회, 1포"
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
                                복용 시작일
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '6px',
                            fontWeight: '500'
                        }}>
                            복용 목적
                        </label>
                        <input
                            type="text"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="예: 면역력 강화, 뼈 건강"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
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
                            저장하기
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

            {/* 영양제 목록 */}
            {supplements.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💊</div>
                    <p style={{ fontSize: '1rem', marginBottom: '8px' }}>등록된 영양제가 없습니다</p>
                    <p style={{ fontSize: '0.85rem' }}>영양제를 추가하여 건강 관리를 시작하세요</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {supplements.map(supp => (
                        <div
                            key={supp.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                borderLeft: '4px solid #10B981'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>💊</span>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                            {supp.name}
                                        </h3>
                                    </div>
                                    {supp.dosage && (
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
                                            📅 {supp.dosage}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(supp.id)}
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

                            {supp.ingredients && (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    color: '#333',
                                    marginBottom: '8px'
                                }}>
                                    <strong>성분:</strong> {supp.ingredients}
                                </div>
                            )}

                            {supp.analysisResult?.analysis && (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#E8F5E9',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    color: '#059669',
                                    lineHeight: '1.5'
                                }}>
                                    🤖 {supp.analysisResult.analysis}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SupplementManager;
