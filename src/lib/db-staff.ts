// =====================================================
// STAFF DATABASE HELPERS
// Funciones auxiliares para operaciones de DB del staff
// =====================================================

import Database from 'better-sqlite3';
import path from 'path';
import type {
  ChildProfile,
  ChildProfileDB,
  ChildObservation,
  AttendanceRecord,
  SessionWithAttendance,
  DailyStaffNote,
  DashboardStats,
  DashboardAlert,
  Allergen,
  MedicalCondition,
  Medication,
  EmergencyContact,
  DevelopmentalMilestone,
} from '@/types/staff';
import { parseOptionalJSON } from './validations/staff';

// =====================================================
// DATABASE CONNECTION
// =====================================================

export function getStaffDB() {
  const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
  return new Database(dbPath);
}

// =====================================================
// CHILD PROFILE HELPERS
// =====================================================

/**
 * Parse child profile from database format to app format
 */
export function parseChildProfile(dbProfile: ChildProfileDB): ChildProfile {
  return {
    ...dbProfile,
    allergies: parseOptionalJSON<Allergen[]>(dbProfile.allergies, []),
    medical_conditions: parseOptionalJSON<MedicalCondition[]>(dbProfile.medical_conditions, []),
    medications: parseOptionalJSON<Medication[]>(dbProfile.medications, []),
    emergency_contacts: parseOptionalJSON<EmergencyContact[]>(dbProfile.emergency_contacts, []),
    milestones: parseOptionalJSON<DevelopmentalMilestone[]>(dbProfile.milestones, []),
  };
}

/**
 * Get all child profiles with subscription info
 */
export function getAllChildProfiles(db: Database.Database): ChildProfile[] {
  const stmt = db.prepare(`
    SELECT
      cp.*,
      s.child_name,
      s.child_age,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as parent_name,
      u.email as parent_email,
      u.phone as parent_phone
    FROM child_profiles cp
    LEFT JOIN subscriptions s ON cp.subscription_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.status IN ('pending', 'active')
    ORDER BY s.child_name ASC
  `);

  const profiles = stmt.all() as ChildProfileDB[];
  return profiles.map(parseChildProfile);
}

/**
 * Get child profile by ID
 */
export function getChildProfileById(db: Database.Database, id: number): ChildProfile | null {
  const stmt = db.prepare(`
    SELECT
      cp.*,
      s.child_name,
      s.child_age,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as parent_name,
      u.email as parent_email,
      u.phone as parent_phone
    FROM child_profiles cp
    LEFT JOIN subscriptions s ON cp.subscription_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE cp.id = ?
  `);

  const profile = stmt.get(id) as ChildProfileDB | undefined;
  return profile ? parseChildProfile(profile) : null;
}

/**
 * Get child profile by subscription ID
 */
export function getChildProfileBySubscriptionId(db: Database.Database, subscriptionId: number): ChildProfile | null {
  const stmt = db.prepare(`
    SELECT
      cp.*,
      s.child_name,
      s.child_age,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as parent_name,
      u.email as parent_email,
      u.phone as parent_phone
    FROM child_profiles cp
    LEFT JOIN subscriptions s ON cp.subscription_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE cp.subscription_id = ?
  `);

  const profile = stmt.get(subscriptionId) as ChildProfileDB | undefined;
  return profile ? parseChildProfile(profile) : null;
}

/**
 * Create or update child profile
 */
export function upsertChildProfile(
  db: Database.Database,
  subscriptionId: number,
  data: Partial<ChildProfile>,
  updatedBy: number
): ChildProfile {
  const existing = getChildProfileBySubscriptionId(db, subscriptionId);

  const profileData = {
    subscription_id: subscriptionId,
    photo_url: data.photo_url ?? existing?.photo_url ?? null,
    birth_date: data.birth_date ?? existing?.birth_date ?? new Date().toISOString().split('T')[0],
    allergies: JSON.stringify(data.allergies ?? existing?.allergies ?? []),
    medical_conditions: JSON.stringify(data.medical_conditions ?? existing?.medical_conditions ?? []),
    medications: JSON.stringify(data.medications ?? existing?.medications ?? []),
    special_needs: data.special_needs ?? existing?.special_needs ?? null,
    emergency_contacts: JSON.stringify(data.emergency_contacts ?? existing?.emergency_contacts ?? []),
    dietary_restrictions: data.dietary_restrictions ?? existing?.dietary_restrictions ?? null,
    favorite_activities: data.favorite_activities ?? existing?.favorite_activities ?? null,
    behavioral_notes: data.behavioral_notes ?? existing?.behavioral_notes ?? null,
    milestones: JSON.stringify(data.milestones ?? existing?.milestones ?? []),
    updated_by: updatedBy,
    last_updated: new Date().toISOString(),
  };

  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE child_profiles
      SET photo_url = ?,
          birth_date = ?,
          allergies = ?,
          medical_conditions = ?,
          medications = ?,
          special_needs = ?,
          emergency_contacts = ?,
          dietary_restrictions = ?,
          favorite_activities = ?,
          behavioral_notes = ?,
          milestones = ?,
          updated_by = ?,
          last_updated = ?
      WHERE subscription_id = ?
    `);

    stmt.run(
      profileData.photo_url,
      profileData.birth_date,
      profileData.allergies,
      profileData.medical_conditions,
      profileData.medications,
      profileData.special_needs,
      profileData.emergency_contacts,
      profileData.dietary_restrictions,
      profileData.favorite_activities,
      profileData.behavioral_notes,
      profileData.milestones,
      profileData.updated_by,
      profileData.last_updated,
      subscriptionId
    );

    return getChildProfileBySubscriptionId(db, subscriptionId)!;
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO child_profiles (
        subscription_id, photo_url, birth_date, allergies, medical_conditions,
        medications, special_needs, emergency_contacts, dietary_restrictions,
        favorite_activities, behavioral_notes, milestones, updated_by, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      profileData.subscription_id,
      profileData.photo_url,
      profileData.birth_date,
      profileData.allergies,
      profileData.medical_conditions,
      profileData.medications,
      profileData.special_needs,
      profileData.emergency_contacts,
      profileData.dietary_restrictions,
      profileData.favorite_activities,
      profileData.behavioral_notes,
      profileData.milestones,
      profileData.updated_by,
      profileData.last_updated
    );

    return getChildProfileById(db, result.lastInsertRowid as number)!;
  }
}

// =====================================================
// OBSERVATION HELPERS
// =====================================================

/**
 * Get observations for a child
 */
export function getChildObservations(
  db: Database.Database,
  childProfileId: number,
  limit = 50
): ChildObservation[] {
  const stmt = db.prepare(`
    SELECT
      co.*,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as staff_name,
      s.child_name
    FROM child_observations co
    LEFT JOIN users u ON co.staff_id = u.id
    LEFT JOIN child_profiles cp ON co.child_profile_id = cp.id
    LEFT JOIN subscriptions s ON cp.subscription_id = s.id
    WHERE co.child_profile_id = ?
    ORDER BY co.observation_date DESC, co.created_at DESC
    LIMIT ?
  `);

  return stmt.all(childProfileId, limit) as ChildObservation[];
}

/**
 * Create new observation
 */
export function createObservation(
  db: Database.Database,
  data: {
    child_profile_id: number;
    session_id?: number;
    staff_id: number;
    observation_date: string;
    category: string;
    observation_text: string;
    is_important?: boolean;
    share_with_parent?: boolean;
  }
): ChildObservation {
  const stmt = db.prepare(`
    INSERT INTO child_observations (
      child_profile_id, session_id, staff_id, observation_date,
      category, observation_text, is_important, shared_with_parent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.child_profile_id,
    data.session_id ?? null,
    data.staff_id,
    data.observation_date,
    data.category,
    data.observation_text,
    data.is_important ? 1 : 0,
    data.share_with_parent ? 1 : 0
  );

  const getStmt = db.prepare('SELECT * FROM child_observations WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as ChildObservation;
}

// =====================================================
// ATTENDANCE HELPERS
// =====================================================

/**
 * Get today's sessions for staff
 */
export function getTodaySessions(db: Database.Database, staffId?: number) {
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT
      s.id,
      s.subscription_id,
      s.session_date,
      s.session_time,
      s.duration_minutes,
      s.status,
      s.conducted_by,
      sub.child_name,
      sub.child_age,
      sub.special_requests,
      srv.name as service_name,
      srv.category as service_category,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as staff_name,
      ar.id as attendance_id,
      ar.check_in_time,
      ar.check_out_time,
      ar.is_late,
      ar.is_early_departure,
      ar.absence_reason
    FROM sessions s
    LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
    LEFT JOIN services srv ON sub.service_id = srv.id
    LEFT JOIN users u ON s.conducted_by = u.id
    LEFT JOIN attendance_records ar ON s.id = ar.session_id
    WHERE s.session_date = ?
      AND s.status IN ('scheduled', 'confirmed')
  `;

  // Solo filtrar por staff si está asignado Y existe un staffId
  // Esto permite que staff vea todas las sesiones sin asignar
  if (staffId) {
    query += ' AND (s.conducted_by = ? OR s.conducted_by IS NULL)';
  }

  query += ' ORDER BY s.session_time ASC';

  const stmt = db.prepare(query);
  const sessions = staffId ? stmt.all(today, staffId) : stmt.all(today);

  interface SessionRow {
    id: number;
    child_name: string;
    service_name: string;
    session_time: string;
    duration_minutes: number;
    special_requests: string | null;
    attendance_id?: number;
    check_in_time?: string;
    check_out_time?: string;
    absence_reason?: string;
    is_late?: boolean;
  }

  return (sessions as SessionRow[]).map(session => ({
    ...session,
    has_alerts: session.special_requests ? session.special_requests.length > 10 : false,
    alert_message: session.special_requests,
  }));
}

/**
 * Check in a session
 */
export function checkInSession(
  db: Database.Database,
  sessionId: number,
  staffId: number,
  checkInTime?: string
): AttendanceRecord {
  const now = checkInTime || new Date().toISOString();

  // Get session info to calculate if late
  const session = db.prepare('SELECT session_time FROM sessions WHERE id = ?').get(sessionId) as { session_time: string } | undefined;

  let isLate = false;
  let lateMinutes = 0;

  if (session) {
    const scheduledTime = new Date(`1970-01-01T${session.session_time}`);
    const actualTime = new Date(now);
    const diffMs = actualTime.getTime() - scheduledTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes > 15) {
      isLate = true;
      lateMinutes = diffMinutes;
    }
  }

  const stmt = db.prepare(`
    INSERT INTO attendance_records (
      session_id, check_in_time, checked_in_by, is_late, late_minutes
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      check_in_time = excluded.check_in_time,
      checked_in_by = excluded.checked_in_by,
      is_late = excluded.is_late,
      late_minutes = excluded.late_minutes,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(sessionId, now, staffId, isLate ? 1 : 0, lateMinutes);

  // Update session status
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('confirmed', sessionId);

  const getStmt = db.prepare('SELECT * FROM attendance_records WHERE session_id = ?');
  return getStmt.get(sessionId) as AttendanceRecord;
}

/**
 * Check out a session
 */
export function checkOutSession(
  db: Database.Database,
  sessionId: number,
  staffId: number,
  checkOutTime?: string
): AttendanceRecord {
  const now = checkOutTime || new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE attendance_records
    SET check_out_time = ?,
        checked_out_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `);

  stmt.run(now, staffId, sessionId);

  // Update session status to completed
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('completed', sessionId);

  const getStmt = db.prepare('SELECT * FROM attendance_records WHERE session_id = ?');
  return getStmt.get(sessionId) as AttendanceRecord;
}

/**
 * Mark session as absent
 */
export function markSessionAbsent(
  db: Database.Database,
  sessionId: number,
  reason: string
): AttendanceRecord {
  const stmt = db.prepare(`
    INSERT INTO attendance_records (
      session_id, absence_reason, absence_notified_parent
    ) VALUES (?, ?, 1)
    ON CONFLICT(session_id) DO UPDATE SET
      absence_reason = excluded.absence_reason,
      absence_notified_parent = 1,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(sessionId, reason);

  // Update session status
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('cancelled', sessionId);

  const getStmt = db.prepare('SELECT * FROM attendance_records WHERE session_id = ?');
  return getStmt.get(sessionId) as AttendanceRecord;
}

// =====================================================
// DASHBOARD HELPERS
// =====================================================

/**
 * Get dashboard statistics
 */
export function getDashboardStats(db: Database.Database, staffId?: number): DashboardStats {
  const today = new Date().toISOString().split('T')[0];

  let whereClause = 'WHERE s.session_date = ?';
  const params: (string | number)[] = [today];

  // Solo filtrar por staff si está asignado Y existe un staffId
  // Esto permite que staff vea todas las sesiones sin asignar
  if (staffId) {
    whereClause += ' AND (s.conducted_by = ? OR s.conducted_by IS NULL)';
    params.push(staffId);
  }

  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as today_sessions,
      SUM(CASE WHEN ar.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN ar.absence_reason IS NOT NULL THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN ar.check_in_time IS NULL AND ar.absence_reason IS NULL THEN 1 ELSE 0 END) as pending
    FROM sessions s
    LEFT JOIN attendance_records ar ON s.id = ar.session_id
    ${whereClause}
  `);

  const stats = statsStmt.get(...params) as DashboardStats;

  // Count alerts (special requests or medical conditions)
  const alertsStmt = db.prepare(`
    SELECT COUNT(*) as alerts
    FROM sessions s
    LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
    ${whereClause}
      AND (sub.special_requests IS NOT NULL AND LENGTH(sub.special_requests) > 0)
  `);

  const alertsData = alertsStmt.get(...params) as { alerts: number };

  return {
    ...stats,
    alerts: alertsData.alerts,
  };
}

/**
 * Get dashboard alerts
 */
export function getDashboardAlerts(db: Database.Database, staffId?: number): DashboardAlert[] {
  const today = new Date().toISOString().split('T')[0];

  let whereClause = 'WHERE s.session_date = ?';
  const params: (string | number)[] = [today];

  // Solo filtrar por staff si está asignado Y existe un staffId
  // Esto permite que staff vea todas las sesiones sin asignar
  if (staffId) {
    whereClause += ' AND (s.conducted_by = ? OR s.conducted_by IS NULL)';
    params.push(staffId);
  }

  const stmt = db.prepare(`
    SELECT
      s.id as session_id,
      sub.child_name,
      cp.id as child_id,
      sub.special_requests,
      cp.allergies,
      cp.medical_conditions
    FROM sessions s
    LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
    LEFT JOIN child_profiles cp ON sub.id = cp.subscription_id
    ${whereClause}
      AND (
        (sub.special_requests IS NOT NULL AND LENGTH(sub.special_requests) > 0)
        OR (cp.allergies IS NOT NULL AND cp.allergies != '[]')
        OR (cp.medical_conditions IS NOT NULL AND cp.medical_conditions != '[]')
      )
    ORDER BY s.session_time ASC
  `);

  interface AlertRow {
    session_id: number;
    child_name: string;
    child_id: number | null;
    special_requests: string | null;
    allergies: string | null;
    medical_conditions: string | null;
  }

  const results = stmt.all(...params) as AlertRow[];

  const alerts: DashboardAlert[] = [];

  results.forEach(row => {
    // Check for medical alerts
    const allergies = parseOptionalJSON<Allergen[]>(row.allergies, []);
    const medicalConditions = parseOptionalJSON<MedicalCondition[]>(row.medical_conditions, []);

    if (allergies.length > 0) {
      const severe = allergies.filter(a => a.severity === 'severe');
      if (severe.length > 0) {
        alerts.push({
          type: 'medical',
          severity: 'high',
          message: `Alergias severas: ${severe.map(a => a.allergen).join(', ')}`,
          child_name: row.child_name,
          child_id: row.child_id ?? undefined,
          session_id: row.session_id,
        });
      }
    }

    if (medicalConditions.length > 0) {
      alerts.push({
        type: 'medical',
        severity: 'medium',
        message: `Condiciones médicas: ${medicalConditions.map(c => c.condition).join(', ')}`,
        child_name: row.child_name,
        child_id: row.child_id ?? undefined,
        session_id: row.session_id,
      });
    }

    // Check for special requests
    if (row.special_requests) {
      alerts.push({
        type: 'general',
        severity: 'low',
        message: row.special_requests,
        child_name: row.child_name,
        child_id: row.child_id ?? undefined,
        session_id: row.session_id,
      });
    }
  });

  return alerts;
}

// =====================================================
// SESSION GENERATION FUNCTIONS
// =====================================================

/**
 * Función auxiliar para obtener todos los días de un mes que coinciden con un día de la semana
 */
function getDaysInMonth(year: number, month: number, dayOfWeek: number): number[] {
  const dates: number[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    if (date.getDay() === dayOfWeek) {
      dates.push(date.getDate());
    }
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

/**
 * Genera sesiones automáticamente para una subscripción basándose en su weekly_schedule
 * @param db - Database instance
 * @param subscriptionId - ID de la subscripción
 * @returns Número de sesiones generadas
 */
export function generateSessionsForSubscription(
  db: Database.Database,
  subscriptionId: number
): number {
  // Obtener datos de la subscripción
  const subscription = db.prepare(`
    SELECT s.*, srv.duration as service_duration
    FROM subscriptions s
    LEFT JOIN services srv ON s.service_id = srv.id
    WHERE s.id = ?
  `).get(subscriptionId) as {
    id: number;
    weekly_schedule: string;
    start_month: number;
    start_year: number;
    service_duration?: number;
  } | undefined;

  if (!subscription) {
    console.warn(`Subscripción ${subscriptionId} no encontrada`);
    return 0;
  }

  const weeklySchedule = JSON.parse(subscription.weekly_schedule || '{}') as Record<string, number | null>;
  const sessions: Array<{
    subscription_id: number;
    session_date: string;
    session_time: string;
    session_number: number;
    duration_minutes: number;
    status: string;
  }> = [];
  const monthsToGenerate = 3;
  let globalSessionNumber = 1;

  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    let currentMonth = subscription.start_month + monthOffset;
    let currentYear = subscription.start_year;

    // Ajustar año si el mes excede 12
    while (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }

    const monthSessions: Array<{
      subscription_id: number;
      session_date: string;
      session_time: string;
      duration_minutes: number;
      status: string;
    }> = [];

    // Horarios por defecto para cada día de la semana
    const defaultTimeSlots: Record<number, string> = {
      0: '09:00', // Domingo
      1: '08:00', // Lunes
      2: '08:00', // Martes
      3: '09:00', // Miércoles
      4: '08:00', // Jueves
      5: '07:00', // Viernes
      6: '09:00'  // Sábado
    };

    // Para cada día de la semana en el weekly_schedule
    for (const [dayOfWeek, slotId] of Object.entries(weeklySchedule)) {
      if (!slotId) continue;

      // Usar horario por defecto basado en el día de la semana
      const defaultTime = defaultTimeSlots[parseInt(dayOfWeek)] || '09:00';

      // Obtener todos los días del mes que coinciden con este día de la semana
      const daysInMonth = getDaysInMonth(currentYear, currentMonth, parseInt(dayOfWeek));

      for (const day of daysInMonth) {
        const sessionDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        monthSessions.push({
          subscription_id: subscriptionId,
          session_date: sessionDate,
          session_time: defaultTime,
          duration_minutes: subscription.service_duration || 60,
          status: 'scheduled'
        });
      }
    }

    // Ordenar sesiones del mes por fecha
    monthSessions.sort((a, b) => a.session_date.localeCompare(b.session_date));

    // Asignar números de sesión y agregar al array principal
    monthSessions.forEach(session => {
      sessions.push({ ...session, session_number: globalSessionNumber++ });
    });
  }

  if (sessions.length === 0) {
    console.warn(`No se generaron sesiones para subscripción ${subscriptionId}`);
    return 0;
  }

  // Insertar todas las sesiones usando una transacción
  const insertStmt = db.prepare(`
    INSERT INTO sessions (
      subscription_id, session_date, session_time,
      session_number, duration_minutes, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((sessionsToInsert: typeof sessions) => {
    for (const session of sessionsToInsert) {
      insertStmt.run(
        session.subscription_id,
        session.session_date,
        session.session_time,
        session.session_number,
        session.duration_minutes,
        session.status
      );
    }
  });

  insertMany(sessions);

  return sessions.length;
}
