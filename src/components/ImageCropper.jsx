import { useState, useRef, useEffect } from 'react';

const ImageCropper = ({ image, onCrop, onCancel }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const imgRef = useRef(null);

    const CROP_SIZE = 250; // 원형 크롭 영역 크기

    useEffect(() => {
        if (image) {
            const img = new Image();
            img.onload = () => {
                // 부모 컨테이너 크기에 맞춰 적절한 초기 비율 계산
                const ratio = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
                const width = img.width * ratio;
                const height = img.height * ratio;
                setImgSize({ width, height });

                // 중앙 배치
                setPosition({
                    x: (CROP_SIZE - width) / 2,
                    y: (CROP_SIZE - height) / 2
                });
            };
            img.src = image;
        }
    }, [image]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        // 경계 제한 (최소한 크롭 영역은 다 채우도록)
        newX = Math.min(0, Math.max(newX, CROP_SIZE - imgSize.width));
        newY = Math.min(0, Math.max(newY, CROP_SIZE - imgSize.height));

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCapture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400; // 결과물 해상도
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        const scale = imgSize.width / 400; // 표시 크기 대비 캔버스 크기 비율

        // 원형으로 그리기 위해 클리핑
        ctx.beginPath();
        ctx.arc(200, 200, 200, 0, Math.PI * 2);
        ctx.clip();

        // 현재 위치에 맞게 원본 이미지를 그림
        const img = new Image();
        img.onload = () => {
            // 이미지 좌표 계산: 표시된 position이 음수이므로, 원본에서의 시작점은 -position * (원본/표시비율)
            const drawSizeWidth = 400 * (imgSize.width / CROP_SIZE);
            const drawSizeHeight = 400 * (imgSize.height / CROP_SIZE);
            const drawX = (position.x / CROP_SIZE) * 400;
            const drawY = (position.y / CROP_SIZE) * 400;

            ctx.drawImage(img, drawX, drawY, drawSizeWidth, drawSizeHeight);
            onCrop(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = image;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            touchAction: 'none'
        }}>
            <h3 style={{ color: 'white', marginBottom: '30px', fontWeight: '500' }}>
                아이의 얼굴을 원 안에 맞춰주세요 ✨
            </h3>

            <div
                ref={containerRef}
                style={{
                    width: CROP_SIZE,
                    height: CROP_SIZE,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '2px solid white',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={(e) => handleMouseDown(e.touches[0])}
                onTouchMove={(e) => handleMouseMove(e.touches[0])}
                onTouchEnd={handleMouseUp}
            >
                <img
                    ref={imgRef}
                    src={image}
                    alt="Original"
                    draggable="false"
                    style={{
                        position: 'absolute',
                        left: position.x,
                        top: position.y,
                        width: imgSize.width,
                        height: imgSize.height,
                        maxWidth: 'none',
                        userSelect: 'none'
                    }}
                />
            </div>

            <p style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '20px' }}>
                사진을 잡고 움직여보세요
            </p>

            <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '12px 30px',
                        borderRadius: '25px',
                        border: '1px solid #666',
                        backgroundColor: 'transparent',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    취소
                </button>
                <button
                    onClick={handleCapture}
                    style={{
                        padding: '12px 40px',
                        borderRadius: '25px',
                        border: 'none',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default ImageCropper;
