'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

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
  check_out_time?: string;
  absence_reason?: string;
  is_late?: boolean;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summary, setSummary] = useState({ total: 0, checked_in: 0, absent: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/staff/attendance/today');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (sessionId: number) => {
    try {
      const res = await fetch('/api/staff/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCheckOut = async (sessionId: number) => {
    try {
      const res = await fetch('/api/staff/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAbsent = async (sessionId: number) => {
    const reason = prompt('Motivo de ausencia:');
    if (!reason) return;

    try {
      const res = await fetch('/api/staff/attendance/absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, absence_reason: reason }),
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Control de Asistencia</h1>
        <p className="text-gray-600 mt-1">Hoy - {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Sesiones</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <p className="text-sm text-green-700">Presentes</p>
          <p className="text-2xl font-bold text-green-600">{summary.checked_in}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
          <p className="text-sm text-red-700">Ausentes</p>
          <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-700">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niño</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => {
                const hasCheckedIn = session.check_in_time;
                const hasCheckedOut = session.check_out_time;
                const isAbsent = session.absence_reason;

                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        {session.session_time}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.child_name}</div>
                      {session.has_alerts && (
                        <div className="flex items-center text-xs text-orange-600 mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Alerta médica
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {session.service_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isAbsent ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Ausente</span>
                      ) : hasCheckedOut ? (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completado</span>
                      ) : hasCheckedIn ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1 w-fit">
                          Presente
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {!isAbsent && !hasCheckedOut && (
                        <div className="flex gap-2">
                          {!hasCheckedIn ? (
                            <>
                              <button
                                onClick={() => handleCheckIn(session.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Check-in
                              </button>
                              <button
                                onClick={() => handleMarkAbsent(session.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1"
                              >
                                <XCircle className="h-3 w-3" />
                                Ausente
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCheckOut(session.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Check-out
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay sesiones programadas para hoy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
