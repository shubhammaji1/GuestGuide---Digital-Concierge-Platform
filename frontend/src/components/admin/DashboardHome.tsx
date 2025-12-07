import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import { MessageSquare, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalChatMessages: number;
  aiResolutionRate: number;
  averageConfidence: number;
  escalationRate: number;
  estimatedHoursSaved: number;
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard', {
        params: { hotelId: user?.hotelId }
      });
      setStats(response.data.analytics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalChatMessages}
                  </p>
                </div>
                <MessageSquare className="text-primary-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Resolution Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.aiResolutionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(stats.averageConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                <Clock className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hours Saved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.estimatedHoursSaved}
                  </p>
                </div>
                <AlertCircle className="text-purple-600" size={32} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/faqs"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Manage FAQs</h3>
              <p className="text-sm text-gray-600">Add or edit frequently asked questions</p>
            </Link>

            <Link
              to="/admin/documents"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-sm text-gray-600">Add PDFs and documents for AI training</p>
            </Link>

            <Link
              to="/admin/analytics"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
              <p className="text-sm text-gray-600">See detailed insights and reports</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

