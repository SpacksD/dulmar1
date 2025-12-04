// =====================================================
// STAFF MODULE TYPES
// Definiciones de tipos TypeScript para módulos de staff
// =====================================================

// =====================================================
// CHILD PROFILE TYPES
// =====================================================

export interface Allergen {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface MedicalCondition {
  condition: string;
  treatment?: string;
  notes?: string;
}

export interface Medication {
  medication: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  is_primary: boolean;
  notes?: string;
}

export interface DevelopmentalMilestone {
  milestone: string;
  date_achieved: string;
  notes?: string;
  category: 'physical' | 'cognitive' | 'social' | 'emotional' | 'language';
}

export interface ChildProfile {
  id: number;
  subscription_id: number;
  photo_url: string | null;
  birth_date: string;

  // Medical info (parsed from JSON)
  allergies: Allergen[];
  medical_conditions: MedicalCondition[];
  medications: Medication[];
  special_needs: string | null;

  // Emergency contacts (parsed from JSON)
  emergency_contacts: EmergencyContact[];

  // Preferences
  dietary_restrictions: string | null;
  favorite_activities: string | null;
  behavioral_notes: string | null;

  // Developmental (parsed from JSON)
  milestones: DevelopmentalMilestone[];

  last_updated: string;
  updated_by: number | null;
  created_at: string;

  // Joined data from subscription
  child_name?: string;
  child_age?: number;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

// Raw database format (before JSON parsing)
export interface ChildProfileDB {
  id: number;
  subscription_id: number;
  photo_url: string | null;
  birth_date: string;
  allergies: string | null; // JSON string
  medical_conditions: string | null; // JSON string
  medications: string | null; // JSON string
  special_needs: string | null;
  emergency_contacts: string | null; // JSON string
  dietary_restrictions: string | null;
  favorite_activities: string | null;
  behavioral_notes: string | null;
  milestones: string | null; // JSON string
  last_updated: string;
  updated_by: number | null;
  created_at: string;
}

// =====================================================
// CHILD OBSERVATION TYPES
// =====================================================

export type ObservationCategory = 'physical' | 'cognitive' | 'social' | 'emotional' | 'language' | 'general';

export interface ChildObservation {
  id: number;
  child_profile_id: number;
  session_id: number | null;
  staff_id: number;
  observation_date: string;
  category: ObservationCategory;
  observation_text: string;
  is_important: boolean;
  shared_with_parent: boolean;
  parent_viewed: boolean;
  parent_viewed_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined data
  staff_name?: string;
  child_name?: string;
}

// =====================================================
// ATTENDANCE TYPES
// =====================================================

export interface AttendanceRecord {
  id: number;
  session_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  checked_in_by: number | null;
  checked_out_by: number | null;
  is_late: boolean;
  is_early_departure: boolean;
  late_minutes: number;
  early_minutes: number;
  absence_reason: string | null;
  absence_notified_parent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined data from session and subscription
  session_date?: string;
  session_time?: string;
  child_name?: string;
  service_name?: string;
  staff_name?: string;
}

export interface AttendanceStatus {
  status: 'present' | 'absent' | 'late' | 'pending';
  color: string;
  label: string;
}

// =====================================================
// SESSION EXTENDED TYPES
// =====================================================

export interface SessionWithAttendance {
  id: number;
  subscription_id: number;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  status: string;
  conducted_by: number | null;

  // Child info
  child_name: string;
  child_age: number;

  // Service info
  service_name: string;
  service_category: string;

  // Attendance info
  attendance?: AttendanceRecord;
  has_alerts: boolean;
  alert_message?: string;

  // Staff info
  staff_name?: string;
}

// =====================================================
// DAILY STAFF NOTES TYPES
// =====================================================

export type StaffMood = 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface DailyStaffNote {
  id: number;
  staff_id: number;
  note_date: string;
  note_text: string | null;
  mood: StaffMood | null;
  energy_level: EnergyLevel | null;
  highlights: string | null;
  concerns: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface DashboardStats {
  today_sessions: number;
  checked_in: number;
  absent: number;
  pending: number;
  alerts: number;
}

export interface DashboardAlert {
  type: 'medical' | 'behavioral' | 'general';
  severity: 'high' | 'medium' | 'low';
  message: string;
  child_name?: string;
  child_id?: number;
  session_id?: number;
}

// =====================================================
// STAFF AVAILABILITY TYPES
// =====================================================

export interface StaffAvailability {
  id: number;
  staff_id: number;
  day_of_week: number; // 0-6
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Check-in/Check-out
export interface CheckInRequest {
  session_id: number;
  check_in_time?: string; // ISO string, defaults to now
  notes?: string;
}

export interface CheckOutRequest {
  session_id: number;
  check_out_time?: string; // ISO string, defaults to now
  notes?: string;
}

export interface MarkAbsentRequest {
  session_id: number;
  absence_reason: string;
  notify_parent?: boolean;
}

// Child Profile Update
export interface UpdateChildProfileRequest {
  photo_url?: string;
  birth_date?: string;
  allergies?: Allergen[];
  medical_conditions?: MedicalCondition[];
  medications?: Medication[];
  special_needs?: string;
  emergency_contacts?: EmergencyContact[];
  dietary_restrictions?: string;
  favorite_activities?: string;
  behavioral_notes?: string;
  milestones?: DevelopmentalMilestone[];
}

// Create Observation
export interface CreateObservationRequest {
  child_profile_id: number;
  session_id?: number;
  observation_date: string;
  category: ObservationCategory;
  observation_text: string;
  is_important?: boolean;
  share_with_parent?: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & Record<string, never>;
