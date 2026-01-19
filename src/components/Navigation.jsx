const Navigation = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'log', label: '관찰 일기', icon: '📝' },
        { id: 'info', label: '발달 정보', icon: '📚' },
        { id: 'growth', label: '성장 관리', icon: '📈' },
        { id: 'health', label: '건강 기록', icon: '🏥' },
        { id: 'chat', label: '육아상담', icon: '🧚' }
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0',
            zIndex: 1000
        }}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === tab.id ? 'var(--primary-color)' : '#999',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>{tab.icon}</span>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                    }}>
                        {tab.label}
                    </span>
                </button>
            ))}
        </nav>
    );
};

export default Navigation;
