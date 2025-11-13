'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  capacity: number;
}

interface ScheduleSlot {
  id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  service_id?: number;
  service_name: string;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
}

export default function HorariosAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    selected_days: [1] as number[], // Array de días seleccionados
    start_time: '08:00',
    end_time: '09:00',
    service_id: '',
    max_capacity: 1
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch schedule slots
      const slotsResponse = await fetch('/api/schedule-slots');
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json();
        setScheduleSlots(slotsData.slots);
      }

      // Fetch services
      const servicesResponse = await fetch('/api/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'service_id') {
      // Cuando cambia el servicio, actualizar automáticamente la capacidad máxima
      const selectedService = services.find(s => s.id === parseInt(value));
      const newCapacity = selectedService?.capacity || (value === '' ? 999 : 1); // 999 para "todos los servicios"

      setFormData(prev => ({
        ...prev,
        service_id: value,
        max_capacity: newCapacity
      }));
    } else if (name === 'max_capacity') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(dayIndex)
        ? prev.selected_days.filter(d => d !== dayIndex)
        : [...prev.selected_days, dayIndex]
    }));
  };

  const resetForm = () => {
    setFormData({
      selected_days: [1],
      start_time: '08:00',
      end_time: '09:00',
      service_id: '',
      max_capacity: 999 // Sin límite por defecto para "todos los servicios"
    });
    setEditingSlot(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.selected_days.length === 0) {
      setError('Debe seleccionar al menos un día');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Crear horario para cada día seleccionado
      for (const dayIndex of formData.selected_days) {
        const response = await fetch('/api/schedule-slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            day_of_week: dayIndex,
            start_time: formData.start_time,
            end_time: formData.end_time,
            service_id: formData.service_id || null,
            max_capacity: formData.max_capacity
          }),
        });

        const result = await response.json();

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${daysOfWeek[dayIndex]}: ${result.error}`);
        }
      }

      if (successCount > 0) {
        setSuccess(`${successCount} horario(s) creado(s) exitosamente${errorCount > 0 ? ` (${errorCount} con errores)` : ''}`);
        if (errorCount === 0) {
          setShowCreateModal(false);
          resetForm();
        }
        fetchData();
      }

      if (errorCount > 0) {
        setError(errors.join('\n'));
      }

    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleEdit = (slot: ScheduleSlot) => {
    setFormData({
      selected_days: [slot.day_of_week], // Solo el día del horario seleccionado para editar
      start_time: slot.start_time,
      end_time: slot.end_time,
      service_id: slot.service_id?.toString() || '',
      max_capacity: slot.max_capacity
    });
    setEditingSlot(slot);
    setShowCreateModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setError('');

    try {
      const response = await fetch(`/api/schedule-slots/${editingSlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_of_week: formData.selected_days[0], // Solo el primer día para edición
          start_time: formData.start_time,
          end_time: formData.end_time,
          service_id: formData.service_id || null,
          max_capacity: formData.max_capacity
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Horario actualizado exitosamente');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        setError(result.error || 'Error al actualizar el horario');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este horario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedule-slots/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Horario eliminado exitosamente');
        fetchData();
      } else {
        setError(result.error || 'Error al eliminar el horario');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const toggleActive = async (slot: ScheduleSlot) => {
    try {
      const response = await fetch(`/api/schedule-slots/${slot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !slot.is_active
        }),
      });

      if (response.ok) {
        setSuccess(`Horario ${!slot.is_active ? 'activado' : 'desactivado'} exitosamente`);
        fetchData();
      } else {
        const result = await response.json();
        setError(result.error || 'Error al cambiar el estado del horario');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const groupedSlots = scheduleSlots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, ScheduleSlot[]>);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Panel Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Horarios</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Horario
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes de éxito/error */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Resumen de horarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Horarios</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleSlots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduleSlots.filter(slot => slot.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduleSlots.reduce((sum, slot) => sum + (slot.is_active ? slot.max_capacity : 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vista de calendario semanal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header del calendario */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Horarios de Atención
            </h3>
          </div>

          {/* Grid de días - Desktop: 7 columnas, Mobile: 1 columna */}
          <div className="hidden md:grid md:grid-cols-7 min-h-96">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => (
              <div key={dayIndex} className="border-r border-gray-200 last:border-r-0 flex flex-col">
                {/* Header del día */}
                <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 text-center">
                    {daysOfWeek[dayIndex]}
                  </h4>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {groupedSlots[dayIndex]?.length || 0} horarios
                  </p>
                </div>

                {/* Lista de horarios del día */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-96">
                  {groupedSlots[dayIndex]?.length > 0 ? (
                    groupedSlots[dayIndex]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                            slot.is_active
                              ? 'border-green-200 bg-green-50 hover:bg-green-100'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75'
                          }`}
                        >
                          {/* Horario */}
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-xs font-semibold text-gray-800">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>

                          {/* Servicio */}
                          <div className="text-center mb-2">
                            <p className="text-xs text-gray-600 truncate" title={slot.service_name}>
                              {slot.service_name || 'Todos los servicios'}
                            </p>
                          </div>

                          {/* Capacidad */}
                          <div className="flex items-center justify-center mb-2">
                            <Users className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-xs text-gray-600">
                              {slot.max_capacity > 100 ? '∞' : slot.max_capacity}
                            </span>
                          </div>

                          {/* Estado */}
                          <div className="flex justify-center mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              slot.is_active
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {slot.is_active ? '●' : '○'}
                            </span>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => toggleActive(slot)}
                                className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                                  slot.is_active
                                    ? 'text-red-600 bg-red-100 hover:bg-red-200'
                                    : 'text-green-600 bg-green-100 hover:bg-green-200'
                                }`}
                                title={slot.is_active ? 'Desactivar' : 'Activar'}
                              >
                                {slot.is_active ? 'OFF' : 'ON'}
                              </button>
                              <button
                                onClick={() => handleEdit(slot)}
                                className="flex-1 px-2 py-1 text-xs text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-3 w-3 mx-auto" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="w-full px-2 py-1 text-xs text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <Calendar className="h-8 w-8 mb-2" />
                      <p className="text-xs text-center">Sin horarios</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vista móvil - Lista por día */}
          <div className="md:hidden">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => (
              <div key={dayIndex} className="border-b border-gray-200 last:border-b-0">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                    <span>{daysOfWeek[dayIndex]}</span>
                    <span className="text-xs text-gray-500">
                      {groupedSlots[dayIndex]?.length || 0} horarios
                    </span>
                  </h4>
                </div>

                <div className="p-4 space-y-3">
                  {groupedSlots[dayIndex]?.length > 0 ? (
                    groupedSlots[dayIndex]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-lg border-2 ${
                            slot.is_active
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-800">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              slot.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {slot.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Servicio:</strong> {slot.service_name || 'Todos los servicios'}
                              </p>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 text-gray-500 mr-1" />
                                <span className="text-sm text-gray-600">
                                  Capacidad: {slot.max_capacity > 100 ? 'Sin límite' : slot.max_capacity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleActive(slot)}
                              className={`flex-1 px-3 py-2 text-sm rounded-md font-medium ${
                                slot.is_active
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {slot.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleEdit(slot)}
                              className="px-3 py-2 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md font-medium"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="px-3 py-2 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-md font-medium"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Calendar className="h-12 w-12 mb-3" />
                      <p className="text-sm text-center">No hay horarios configurados para este día</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar horario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSlot ? 'Editar Horario' : 'Crear Nuevo Horario'}
              </h3>

              <form onSubmit={editingSlot ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingSlot ? 'Día de la Semana *' : 'Días de la Semana *'}
                  </label>
                  {editingSlot ? (
                    // Modo edición: solo mostrar el día actual (solo lectura visual)
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                      {daysOfWeek[formData.selected_days[0]]}
                    </div>
                  ) : (
                    // Modo creación: checkboxes para selección múltiple
                    <div>
                      {/* Botones de selección rápida */}
                      <div className="flex space-x-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selected_days: [1, 2, 3, 4, 5] }))}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          Lun-Vie
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selected_days: [0, 6] }))}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          Fines de semana
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selected_days: [0, 1, 2, 3, 4, 5, 6] }))}
                          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selected_days: [] }))}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          Limpiar
                        </button>
                      </div>

                      {/* Checkboxes */}
                      <div className="grid grid-cols-2 gap-2">
                        {daysOfWeek.map((day, index) => (
                          <label key={index} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selected_days.includes(index)}
                              onChange={() => handleDayToggle(index)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {!editingSlot && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona uno o más días para crear horarios múltiples
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fin *
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio
                  </label>
                  <select
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Todos los servicios</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad Máxima *
                  </label>
                  <input
                    type="number"
                    name="max_capacity"
                    value={formData.max_capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.service_id === ''
                      ? 'Sin límite para todos los servicios'
                      : `Capacidad automática del servicio seleccionado`}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingSlot ? 'Actualizar' : 'Crear'} Horario
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}