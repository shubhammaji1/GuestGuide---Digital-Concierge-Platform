import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ChatInterface from '../components/guest/ChatInterface';
import GuideSections from '../components/guest/GuideSections';
import LanguageSelector from '../components/guest/LanguageSelector';
import { Wifi, Clock, UtensilsCrossed, Phone, Menu, X } from 'lucide-react';

interface Hotel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  wifi_ssid?: string;
  check_in_time?: string;
  check_out_time?: string;
  breakfast_time_start?: string;
  breakfast_time_end?: string;
  emergency_contact?: string;
}

export default function GuestApp() {
  const { slug } = useParams<{ slug?: string }>();
  const { t, i18n } = useTranslation();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'guide'>('chat');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadHotel();
  }, [slug]);

  const loadHotel = async () => {
    try {
      setLoading(true);
      const hotelSlug = slug || 'demo'; // Default to demo if no slug
      const response = await api.get(`/guest/hotel/${hotelSlug}`);
      setHotel(response.data.hotel);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load hotel information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="text-center fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">{t('loading')}</p>
          <p className="mt-2 text-sm text-gray-500">Loading hotel information...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hotel Not Found</h1>
            <p className="text-red-600 mb-2">{error || 'The hotel you are looking for does not exist.'}</p>
            <p className="text-sm text-gray-600 mb-4">
              The hotel slug "{slug || 'unknown'}" is not registered in our system.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={loadHotel}
              className="btn btn-primary w-full"
            >
              {t('tryAgain')}
            </button>
            <a
              href="/hotel/demo"
              className="block btn btn-secondary w-full"
            >
              Try Demo Hotel
            </a>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = hotel.primary_color || '#3B82F6';
  const secondaryColor = hotel.secondary_color || '#1E40AF';

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hotel.logo_url ? (
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm p-1.5 shadow-lg">
                <img 
                  src={hotel.logo_url} 
                  alt={hotel.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">{hotel.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">{hotel.name}</h1>
              {hotel.description && (
                <p className="text-white/80 text-xs leading-tight line-clamp-1">{hotel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Quick Actions Menu */}
        {menuOpen && (
          <div className="bg-white/95 backdrop-blur-md border-t border-white/20 px-4 py-4 animate-slideDown">
            <div className="grid grid-cols-2 gap-3">
              {hotel.wifi_ssid && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hotel.wifi_ssid);
                    setMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                    <Wifi size={18} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-600 font-medium">WiFi</p>
                    <p className="text-sm font-bold text-gray-900">{hotel.wifi_ssid}</p>
                  </div>
                </button>
              )}
              {hotel.check_in_time && (
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl shadow-sm">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Clock size={18} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-600 font-medium">Check-in</p>
                    <p className="text-sm font-bold text-gray-900">{hotel.check_in_time}</p>
                  </div>
                </div>
              )}
              {hotel.breakfast_time_start && (
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl shadow-sm">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <UtensilsCrossed size={18} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-600 font-medium">Breakfast</p>
                    <p className="text-sm font-bold text-gray-900">
                      {hotel.breakfast_time_start} - {hotel.breakfast_time_end}
                    </p>
                  </div>
                </div>
              )}
              {hotel.emergency_contact && (
                <a
                  href={`tel:${hotel.emergency_contact}`}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl hover:from-red-100 hover:to-red-200 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-600 font-medium">Emergency</p>
                    <p className="text-sm font-bold text-gray-900">{hotel.emergency_contact}</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/95 backdrop-blur-md border-t border-white/20 shadow-sm">
          <div className="max-w-md mx-auto flex px-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-center font-semibold transition-all relative ${
                activeTab === 'chat'
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('chat')}
              {activeTab === 'chat' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-3 text-center font-semibold transition-all relative ${
                activeTab === 'guide'
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('guide')}
              {activeTab === 'guide' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        {activeTab === 'chat' ? (
          <ChatInterface hotelId={hotel.id} />
        ) : (
          <GuideSections hotelId={hotel.id} />
        )}
      </main>
    </div>
  );
}

