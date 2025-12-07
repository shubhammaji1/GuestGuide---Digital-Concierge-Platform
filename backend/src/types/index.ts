// Shared types for the backend

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  check_in_time?: string;
  check_out_time?: string;
  breakfast_time_start?: string;
  breakfast_time_end?: string;
  emergency_contact?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface User {
  id: number;
  hotel_id?: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff' | 'super_admin';
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface FAQ {
  id: number;
  hotel_id: number;
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Document {
  id: number;
  hotel_id: number;
  name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  content_text?: string;
  embedding_id?: string;
  is_active?: boolean;
  uploaded_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatLog {
  id: number;
  hotel_id: number;
  session_id?: string;
  question: string;
  answer: string;
  ai_confidence?: number;
  was_ai_response?: boolean;
  escalated_to_staff?: boolean;
  language?: string;
  created_at?: Date;
}

export interface AnalyticsEvent {
  id: number;
  hotel_id: number;
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
  created_at?: Date;
}

export interface GuideSection {
  id: number;
  hotel_id: number;
  title: string;
  icon?: string;
  content?: string;
  order_index?: number;
  is_enabled?: boolean;
  section_type?: string;
  created_at?: Date;
  updated_at?: Date;
}

