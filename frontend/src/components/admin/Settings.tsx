import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

interface HotelSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  wifi_ssid: string;
  wifi_password: string;
  check_in_time: string;
  check_out_time: string;
  breakfast_time_start: string;
  breakfast_time_end: string;
  emergency_contact: string;
}

export default function Settings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<HotelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get(`/hotels/${user?.hotelId}`);
      setSettings(response.data.hotel);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !user?.hotelId) return;

    setSaving(true);
    try {
      await api.put(`/hotels/${user.hotelId}`, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof HotelSettings, value: string) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6">Failed to load settings</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Settings</h1>
          <p className="text-gray-600 mt-1">Configure your hotel information and branding</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                className="input"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                className="input h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) => handleChange('secondary_color', e.target.value)}
                className="input h-10"
              />
            </div>
          </div>
        </div>

        {/* WiFi */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WiFi Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WiFi SSID
              </label>
              <input
                type="text"
                value={settings.wifi_ssid}
                onChange={(e) => handleChange('wifi_ssid', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WiFi Password
              </label>
              <input
                type="text"
                value={settings.wifi_password}
                onChange={(e) => handleChange('wifi_password', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Times */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Time
              </label>
              <input
                type="time"
                value={settings.check_in_time}
                onChange={(e) => handleChange('check_in_time', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Time
              </label>
              <input
                type="time"
                value={settings.check_out_time}
                onChange={(e) => handleChange('check_out_time', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breakfast Start
              </label>
              <input
                type="time"
                value={settings.breakfast_time_start}
                onChange={(e) => handleChange('breakfast_time_start', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breakfast End
              </label>
              <input
                type="time"
                value={settings.breakfast_time_end}
                onChange={(e) => handleChange('breakfast_time_end', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Emergency */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact
            </label>
            <input
              type="text"
              value={settings.emergency_contact}
              onChange={(e) => handleChange('emergency_contact', e.target.value)}
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

