import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import DashboardHome from '../components/admin/DashboardHome';
import FAQsManagement from '../components/admin/FAQsManagement';
import DocumentsManagement from '../components/admin/DocumentsManagement';
import Analytics from '../components/admin/Analytics';
import Settings from '../components/admin/Settings';
import {
  LayoutDashboard,
  HelpCircle,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/admin/faqs', icon: HelpCircle, label: t('faqs') },
    { path: '/admin/documents', icon: FileText, label: t('documents') },
    { path: '/admin/analytics', icon: BarChart3, label: t('analytics') },
    { path: '/admin/settings', icon: SettingsIcon, label: t('settings') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm lg:hidden sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold">GuestGuide</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-200 lg:transition-none`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">GuestGuide</h2>
              <p className="text-sm text-gray-600 mt-1">{user?.hotelName || 'Admin'}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <Routes>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/faqs" element={<FAQsManagement />} />
            <Route path="/documents" element={<DocumentsManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<DashboardHome />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

