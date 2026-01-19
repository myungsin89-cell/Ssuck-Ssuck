import React, { useState } from 'react';
import DataService from '../services/DataService';

const Login = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);

    // 로그인/회원가입 필드
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [name, setName] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!userId.trim() || !password.trim()) {
            setError('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 사용자 인증 (Firestore + localStorage)
            const user = await DataService.authenticateUser(userId, password);

            if (!user) {
                setError('아이디 또는 비밀번호가 일치하지 않습니다.');
                setIsLoading(false);
                return;
            }

            // 현재 사용자 정보 저장 (내부에서 syncFromServer 호출됨)
            await DataService.setCurrentUser(user.userId, user.name);

            onLogin({ id: user.userId, nickname: user.name });
        } catch (error) {
            console.error('Login error:', error);
            setError('로그인 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!userId.trim() || !password.trim() || !name.trim()) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 4) {
            setError('비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 사용자 등록 (Firestore + localStorage)
            const success = await DataService.registerUser(userId, password, name);

            if (!success) {
                setError('이미 존재하는 아이디입니다.');
                setIsLoading(false);
                return;
            }

            // 자동 로그인
            await DataService.setCurrentUser(userId, name);
            onLogin({ id: userId, nickname: name });
        } catch (error) {
            console.error('SignUp error:', error);
            setError('회원가입 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            backgroundColor: 'var(--background-color)',
            backgroundImage: 'radial-gradient(#FFF9C4 0.5px, var(--background-color) 0.5px)',
            backgroundSize: '20px 20px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <img
                        src="/icon-512.png"
                        alt="쑥쑥일기 로고"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'contain',
                            animation: 'bounce 2s infinite'
                        }}
                    />
                </div>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-dark)',
                    marginBottom: '10px'
                }}>쑥쑥일기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    아이의 소중한 성장 기록,<br />
                    똑똑하게 도와드릴게요.
                </p>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '350px',
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    {isSignUp ? '회원가입' : '로그인'}
                </h2>

                {/* 아이디 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        color: '#666',
                        marginBottom: '6px'
                    }}>
                        아이디
                    </label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => {
                            setUserId(e.target.value);
                            setError('');
                        }}
                        placeholder="아이디를 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            border: '2px solid #eee',
                            borderRadius: '8px',
                            outline: 'none',
                            transition: 'border 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = '#eee'}
                    />
                </div>

                {/* 비밀번호 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        color: '#666',
                        marginBottom: '6px'
                    }}>
                        비밀번호
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="비밀번호를 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            border: '2px solid #eee',
                            borderRadius: '8px',
                            outline: 'none',
                            transition: 'border 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = '#eee'}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isSignUp) {
                                handleLogin();
                            }
                        }}
                    />
                </div>

                {/* 회원가입 시 추가 필드 */}
                {isSignUp && (
                    <>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.9rem',
                                color: '#666',
                                marginBottom: '6px'
                            }}>
                                비밀번호 확인
                            </label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => {
                                    setPasswordConfirm(e.target.value);
                                    setError('');
                                }}
                                placeholder="비밀번호를 다시 입력하세요"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    border: '2px solid #eee',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = '#eee'}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.9rem',
                                color: '#666',
                                marginBottom: '6px'
                            }}>
                                이름
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                placeholder="이름을 입력하세요 (예: 엄마, 아빠)"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    border: '2px solid #eee',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = '#eee'}
                            />
                        </div>
                    </>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <div style={{
                        color: '#E53E3E',
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                        textAlign: 'center',
                        padding: '8px',
                        backgroundColor: '#FFF5F5',
                        borderRadius: '6px'
                    }}>
                        {error}
                    </div>
                )}

                {/* 로그인/회원가입 버튼 */}
                <button
                    onClick={isSignUp ? handleSignUp : handleLogin}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: isLoading ? '#ccc' : 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        marginBottom: '12px',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => !isLoading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !isLoading && (e.target.style.opacity = '1')}
                >
                    {isLoading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
                </button>

                {/* 전환 버튼 */}
                <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setPassword('');
                        setPasswordConfirm('');
                        setName('');
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: isSignUp ? '#666' : '#2d9f5d',
                        border: 'none',
                        fontSize: '0.9rem',
                        fontWeight: isSignUp ? 'normal' : 'bold',
                        cursor: 'pointer'
                    }}
                >
                    {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                </button>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
};

export default Login;
