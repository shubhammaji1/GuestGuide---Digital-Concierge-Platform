import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import { MessageSquare, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface AnalyticsData {
  totalChatMessages: number;
  aiResolutionRate: number;
  averageConfidence: number;
  escalationRate: number;
  estimatedHoursSaved: number;
  topQuestions: Array<{ question: string; count: string }>;
  dailyActivity: Array<{ date: string; count: string }>;
}

export default function Analytics() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const params: any = { hotelId: user?.hotelId };
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/analytics/dashboard', { params });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-6">No analytics data available</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600 mt-1">Track guest engagement and AI performance</p>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="btn btn-secondary w-full"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.totalChatMessages}
              </p>
            </div>
            <MessageSquare className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Resolution Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {analytics.aiResolutionRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="text-green-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {(analytics.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <Clock className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Saved</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {analytics.estimatedHoursSaved}
              </p>
            </div>
            <AlertCircle className="text-purple-600" size={40} />
          </div>
        </div>
      </div>

      {/* Top Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Questions</h2>
          <div className="space-y-3">
            {analytics.topQuestions.length > 0 ? (
              analytics.topQuestions.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 flex-1">{item.question}</p>
                  <span className="ml-4 px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No questions yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h2>
          <div className="space-y-2">
            {analytics.dailyActivity.length > 0 ? (
              analytics.dailyActivity.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(parseInt(item.count) / Math.max(...analytics.dailyActivity.map(d => parseInt(d.count)))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No activity data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

