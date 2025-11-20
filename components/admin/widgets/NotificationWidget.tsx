import { Bell, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { DashboardNotification } from '@/types';

interface NotificationWidgetProps {
  notifications: DashboardNotification[];
}

export default function NotificationWidget({ notifications }: NotificationWidgetProps) {
  const getIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getBgColor = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">알림/공지사항</h3>
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">새로운 알림이 없습니다</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded-lg ${getBgColor(notification.type)} ${notification.isRead ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-2">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
