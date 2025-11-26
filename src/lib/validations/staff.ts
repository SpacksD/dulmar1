// =====================================================
// STAFF MODULE VALIDATIONS (Zod Schemas)
// Esquemas de validación para APIs de staff
// =====================================================

import { z } from 'zod';

// =====================================================
// CHILD PROFILE SCHEMAS
// =====================================================

export const allergenSchema = z.object({
  allergen: z.string().min(1, 'Allergen name is required'),
  severity: z.enum(['mild', 'moderate', 'severe']),
  notes: z.string().optional(),
});

export const medicalConditionSchema = z.object({
  condition: z.string().min(1, 'Condition name is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export const medicationSchema = z.object({
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  notes: z.string().optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  relation: z.string().min(1, 'Relation is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  is_primary: z.boolean(),
  notes: z.string().optional(),
});

export const developmentalMilestoneSchema = z.object({
  milestone: z.string().min(1, 'Milestone description is required'),
  date_achieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
  category: z.enum(['physical', 'cognitive', 'social', 'emotional', 'language']),
});

export const updateChildProfileSchema = z.object({
  photo_url: z.string().url().optional().nullable(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format').optional(),
  allergies: z.array(allergenSchema).optional(),
  medical_conditions: z.array(medicalConditionSchema).optional(),
  medications: z.array(medicationSchema).optional(),
  special_needs: z.string().optional().nullable(),
  emergency_contacts: z.array(emergencyContactSchema).optional(),
  dietary_restrictions: z.string().optional().nullable(),
  favorite_activities: z.string().optional().nullable(),
  behavioral_notes: z.string().optional().nullable(),
  milestones: z.array(developmentalMilestoneSchema).optional(),
});

// =====================================================
// OBSERVATION SCHEMAS
// =====================================================

export const createObservationSchema = z.object({
  child_profile_id: z.number().int().positive('Child profile ID is required'),
  session_id: z.number().int().positive().optional().nullable(),
  staff_id: z.number().int().positive('Staff ID is required'),
  observation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.enum(['physical', 'cognitive', 'social', 'emotional', 'language', 'general']),
  observation_text: z.string().min(10, 'Observation must be at least 10 characters'),
  is_important: z.boolean().optional().default(false),
  share_with_parent: z.boolean().optional().default(false),
});

export const updateObservationSchema = z.object({
  observation_text: z.string().min(10, 'Observation must be at least 10 characters').optional(),
  category: z.enum(['physical', 'cognitive', 'social', 'emotional', 'language', 'general']).optional(),
  is_important: z.boolean().optional(),
  share_with_parent: z.boolean().optional(),
});

// =====================================================
// ATTENDANCE SCHEMAS
// =====================================================

export const checkInSchema = z.object({
  session_id: z.number().int().positive('Session ID is required'),
  check_in_time: z.string().datetime().optional(), // ISO 8601 datetime
  notes: z.string().optional().nullable(),
});

export const checkOutSchema = z.object({
  session_id: z.number().int().positive('Session ID is required'),
  check_out_time: z.string().datetime().optional(), // ISO 8601 datetime
  notes: z.string().optional().nullable(),
});

export const markAbsentSchema = z.object({
  session_id: z.number().int().positive('Session ID is required'),
  absence_reason: z.string().min(3, 'Absence reason must be at least 3 characters'),
  notify_parent: z.boolean().optional().default(true),
});

// =====================================================
// DAILY STAFF NOTES SCHEMAS
// =====================================================

export const createDailyNoteSchema = z.object({
  note_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  note_text: z.string().optional().nullable(),
  mood: z.enum(['excellent', 'good', 'neutral', 'challenging', 'difficult']).optional().nullable(),
  energy_level: z.enum(['high', 'medium', 'low']).optional().nullable(),
  highlights: z.string().optional().nullable(),
  concerns: z.string().optional().nullable(),
});

export const updateDailyNoteSchema = createDailyNoteSchema.partial();

// =====================================================
// QUERY PARAMETER SCHEMAS
// =====================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const attendanceReportQuerySchema = paginationSchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  child_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['present', 'absent', 'late', 'pending']).optional(),
});

export const childrenQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  age_min: z.coerce.number().int().min(0).optional(),
  age_max: z.coerce.number().int().max(120).optional(),
  has_alerts: z.coerce.boolean().optional(),
});

export const observationsQuerySchema = paginationSchema.extend({
  child_profile_id: z.coerce.number().int().positive().optional(),
  category: z.enum(['physical', 'cognitive', 'social', 'emotional', 'language', 'general']).optional(),
  is_important: z.coerce.boolean().optional(),
  shared_with_parent: z.coerce.boolean().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function parseOptionalJSON<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}
