'use client';

import { Calendar, Clock } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Agenda</h1>
        <p className="text-gray-600 mt-1">Horarios y sesiones programadas</p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Próximamente</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            El módulo de agenda semanal estará disponible pronto. Aquí podrás ver y gestionar tu horario completo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Vista Semanal</h3>
              <p className="text-sm text-gray-600">Visualiza tu horario completo de la semana</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Gestión de Tiempo</h3>
              <p className="text-sm text-gray-600">Administra tus sesiones programadas</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Disponibilidad</h3>
              <p className="text-sm text-gray-600">Configura tu disponibilidad semanal</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Por ahora puedes ver tus sesiones del día en el{' '}
              <a href="/staff/dashboard" className="underline hover:text-yellow-900">Dashboard</a>
              {' '}y gestionar la asistencia en{' '}
              <a href="/staff/attendance" className="underline hover:text-yellow-900">Control de Asistencia</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
