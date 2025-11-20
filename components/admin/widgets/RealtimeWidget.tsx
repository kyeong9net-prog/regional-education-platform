import { Activity, Users, FileText } from 'lucide-react';

interface RealtimeWidgetProps {
  activeUsers: number;
  generatingNow: number;
}

export default function RealtimeWidget({ activeUsers = 12, generatingNow = 3 }: RealtimeWidgetProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">실시간 현황</h3>
        <div className="ml-auto">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">접속 중인 사용자</span>
          </div>
          <span className="text-xl font-bold text-blue-600">{activeUsers}명</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">현재 생성 중</span>
          </div>
          <span className="text-xl font-bold text-purple-600">{generatingNow}건</span>
        </div>
      </div>
    </div>
  );
}
