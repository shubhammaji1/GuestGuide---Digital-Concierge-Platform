import { useState, useEffect } from 'react';
import { ChevronRight, Wifi, Clock, UtensilsCrossed, Phone, MapPin, Car } from 'lucide-react';
import api from '../../api/client';

interface GuideSection {
  id: number;
  title: string;
  icon?: string;
  content?: string;
  section_type?: string;
}

interface GuideSectionsProps {
  hotelId: number;
}

const iconMap: Record<string, any> = {
  wifi: Wifi,
  clock: Clock,
  breakfast: UtensilsCrossed,
  phone: Phone,
  location: MapPin,
  transport: Car,
};

export default function GuideSections({ hotelId }: GuideSectionsProps) {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  useEffect(() => {
    loadSections();
  }, [hotelId]);

  const loadSections = async () => {
    try {
      const response = await api.get(`/guest/guide/${hotelId}`);
      setSections(response.data.sections);
    } catch (error) {
      console.error('Failed to load guide sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-500">No guide sections available</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {sections.map((section, index) => {
        const IconComponent = section.icon && iconMap[section.icon.toLowerCase()]
          ? iconMap[section.icon.toLowerCase()]
          : ChevronRight;

        return (
          <div
            key={section.id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden
                     hover:shadow-xl transition-all duration-300 fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <button
              onClick={() => setExpandedSection(
                expandedSection === section.id ? null : section.id
              )}
              className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-sm">
                  <IconComponent size={22} className="text-primary-600" />
                </div>
                <span className="font-bold text-gray-900 text-left">{section.title}</span>
              </div>
              <div className={`p-2 rounded-lg transition-all ${
                expandedSection === section.id 
                  ? 'bg-primary-100 rotate-90' 
                  : 'bg-gray-100'
              }`}>
                <ChevronRight
                  size={18}
                  className={`text-gray-600 transition-transform ${
                    expandedSection === section.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {expandedSection === section.id && section.content && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 animate-slideDown">
                <div className="pt-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

