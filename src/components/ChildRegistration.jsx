import { useState, useEffect } from 'react';
import DataService from '../services/DataService';
import ImageCropper from './ImageCropper';

const ChildRegistration = ({ onSave, onClose, isOpen = true, initialData = null, onLogout }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 크롭 관련 상태
    const [isCropping, setIsCropping] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setBirthDate(initialData.birthDate || '');
            setPhotoUrl(initialData.photoUrl || '');
        } else {
            setName('');
            setBirthDate('');
            setPhotoUrl('');
        }
    }, [initialData, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setTempImage(event.target.result);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedDataUrl) => {
        setPhotoUrl(croppedDataUrl);
        setIsCropping(false);
        setTempImage(null);
    };

    const handleSave = async () => {
        const currentUser = DataService.getCurrentUser();
        if (!currentUser) {
            setError('로그인이 필요합니다.');
            return;
        }

        // 새로운 아이 등록
        if (!name.trim() || !birthDate) {
            setError('이름과 생년월일을 모두 입력해주세요.');
            return;
        }

        const childId = initialData?.id || Date.now();
        const updatedInfo = {
            id: childId,
            name,
            birthDate,
            photoUrl: photoUrl || 'https://api.dicebear.com/7.x/miniavs/svg?seed=baby'
        };

        try {
            await DataService.saveChildInfo(updatedInfo, currentUser.userId);

            // 새로 등록하는 경우에만 가족 그룹 생성
            if (!initialData) {
                await DataService.createFamilyGroup(childId, currentUser.userId, currentUser.name);
            }

            if (onSave) onSave(updatedInfo);
            if (onClose) onClose();
        } catch (err) {
            console.error('Save failed:', err);
            setError('저장 중 오류가 발생했습니다.');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: initialData ? 'fixed' : 'relative',
            top: 0, left: 0, right: 0, bottom: 0,
            minHeight: initialData ? 'auto' : '100vh',
            backgroundColor: initialData ? 'rgba(0,0,0,0.5)' : '#ffffff',
            padding: initialData ? '20px' : '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: initialData ? '32px' : '0',
                boxShadow: initialData ? '0 10px 40px rgba(0,0,0,0.2)' : 'none',
                position: 'relative'
            }}>
                {initialData && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '20px',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#ccc'
                        }}
                    >
                        ✕
                    </button>
                )}

                {/* 상단 헤더 영역 (로그아웃 버튼 등) */}
                {!initialData && onLogout && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '10px'
                    }}>
                        <button
                            onClick={onLogout}
                            style={{
                                background: 'white',
                                border: '1px solid #FFCDD2',
                                borderRadius: '20px',
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                color: '#E53E3E',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                zIndex: 10
                            }}
                        >
                            로그아웃
                        </button>
                    </div>
                )}

                <h2 style={{
                    marginBottom: '30px',
                    textAlign: 'center',
                    color: 'var(--primary-dark)',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                }}>
                    {initialData ? '우리 아이 정보 수정' : '우리 아이 정보 등록'}
                </h2>

                <div style={{ marginBottom: '35px', textAlign: 'center' }}>
                    <div
                        style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <img
                            src={photoUrl || 'https://api.dicebear.com/7.x/miniavs/svg?seed=baby'}
                            alt="Profile"
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid var(--secondary-color)',
                                backgroundColor: '#f9f9f9',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '5px',
                            bottom: '5px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            padding: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            border: '1px solid #eee'
                        }}>
                            ✏️
                        </div>
                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px' }}>
                        사진을 눌러서 변경해보세요
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#555' }}>아이 이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 복덩이"
                        style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            backgroundColor: '#f8f9fa',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#555' }}>생년월일</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            backgroundColor: '#f8f9fa',
                            fontSize: '1rem',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#FFF5F5',
                        border: '1px solid #FED7D7',
                        borderRadius: '8px',
                        color: '#E53E3E',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '16px',
                        border: 'none',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(232, 116, 116, 0.3)'
                    }}
                >
                    {initialData ? '정보 수정하기' : '쑥쑥일기와 시작하기'}
                </button>
            </div>

            {/* 크롭 컴포넌트 */}
            {isCropping && (
                <ImageCropper
                    image={tempImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setIsCropping(false)}
                />
            )}
        </div>
    );
};

export default ChildRegistration;
