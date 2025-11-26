'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle, Bell } from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: number;
  child_name: string;
  service_name: string;
  session_time: string;
  duration_minutes: number;
  has_alerts: boolean;
  alert_message?: string;
  attendance_id?: number;
  check_in_time?: string;
}

interface DashboardStats {
  today_sessions: number;
  checked_in: number;
  absent: number;
  pending: number;
  alerts: number;
}

interface Alert {
  type: 'medical' | 'behavioral' | 'schedule' | 'general';
  severity: 'high' | 'medium' | 'low';
  message: string;
  child_name?: string;
  child_id?: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    today_sessions: 0,
    checked_in: 0,
    absent: 0,
    pending: 0,
    alerts: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect admins to attendance page
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user?.role === 'admin') {
      router.push('/staff/attendance');
    }
  }, [session, status, router]);

  useEffect(() => {
    // Only fetch data if user is staff
    if (session?.user?.role === 'staff') {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/staff/dashboard/today');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
        setStats(data.data.stats);
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'behavioral': return '⚠️';
      case 'schedule': return '📅';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => !s.check_in_time).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sesiones Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today_sessions}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Presentes</p>
              <p className="text-2xl font-bold text-green-600">{stats.checked_in}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Ausentes</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Alertas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.alerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Próximas Sesiones</h2>
              <Link
                href="/staff/attendance"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </Link>
            </div>
          </div>
          <div className="p-4">
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.child_name}</p>
                        <p className="text-xs text-gray-600">{session.service_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{session.session_time}</p>
                      <p className="text-xs text-gray-600">{session.duration_minutes} min</p>
                    </div>
                    {session.has_alerts && (
                      <div className="ml-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay sesiones pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
              <Bell className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-4">
            {alerts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-lg flex-shrink-0">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1 min-w-0">
                        {alert.child_name && (
                          <p className="text-xs font-semibold text-gray-900 mb-1">
                            {alert.child_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-700">{alert.message}</p>
                        {alert.child_id && (
                          <Link
                            href={`/staff/children/${alert.child_id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                          >
                            Ver perfil →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay alertas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/staff/attendance"
          className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Control de Asistencia</p>
              <p className="text-sm text-blue-700">Registrar llegadas y salidas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/staff/children"
          className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Perfiles de Niños</p>
              <p className="text-sm text-purple-700">Ver información y observaciones</p>
            </div>
          </div>
        </Link>

        <Link
          href="/staff/schedule"
          className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Mi Agenda</p>
              <p className="text-sm text-green-700">Ver horarios y sesiones</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
