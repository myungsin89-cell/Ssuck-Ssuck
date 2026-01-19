
import DataService from './DataService';
import FirestoreService from './FirestoreService';

class NotificationService {
    constructor() {
        this.lastReadTime = localStorage.getItem('lastReadTime') || new Date(0).toISOString();
        this.notifications = [];
    }

    // 새로운 알림 확인 (새 로그 감지)
    async checkForNewLogs(childId, currentUserId) {
        if (!childId || !currentUserId) return [];

        try {
            // Firestore에서 모든 로그 가져오기 (실제로는 date 필터링이 효율적이지만, 현재는 전체 가져와서 필터링)
            // 성능 최적화를 위해 최근 100개만 가져오거나 하는 로직은 FirestoreService 레벨에서 처리 권장
            const logs = await FirestoreService.getLogs(childId);

            // 1. 내가 쓴 글 제외
            // 2. 마지막 읽은 시간 이후의 글만 필터링
            const newLogs = logs.filter(log => {
                return String(log.authorId) !== String(currentUserId) &&
                    new Date(log.createdAt) > new Date(this.lastReadTime);
            });

            // 알림 객체로 변환
            const newNotifications = newLogs.map(log => ({
                id: `noti_${log.id}`,
                type: 'new_log',
                timestamp: log.createdAt,
                senderName: log.authorName || '가족',
                content: `📝 '${log.content.substring(0, 10)}...' 일기를 남겼어요.`,
                data: log
            }));

            // 시간순 정렬 (최신순)
            newNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            this.notifications = newNotifications;
            return newNotifications;
        } catch (error) {
            console.error('Error checking notifications:', error);
            return [];
        }
    }

    getUnreadCount() {
        return this.notifications.length;
    }

    markAsRead() {
        const now = new Date().toISOString();
        this.lastReadTime = now;
        localStorage.setItem('lastReadTime', now);
        this.notifications = []; // 클리어
    }

    // 알림 목록 반환
    getNotifications() {
        return this.notifications;
    }
}

export default new NotificationService();
