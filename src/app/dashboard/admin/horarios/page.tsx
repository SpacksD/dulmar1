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
    day_of_week: 1,
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
      router.push('/dashboard');
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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_of_week' || name === 'max_capacity'
        ? parseInt(value) || 0
        : value
    }));
  };

  const resetForm = () => {
    setFormData({
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:00',
      service_id: '',
      max_capacity: 1
    });
    setEditingSlot(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/schedule-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          service_id: formData.service_id || null
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Horario creado exitosamente');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        setError(result.error || 'Error al crear el horario');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleEdit = (slot: ScheduleSlot) => {
    setFormData({
      day_of_week: slot.day_of_week,
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
          ...formData,
          service_id: formData.service_id || null
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
    } catch  {
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
    } catch  {
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
    } catch  {
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
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Dashboard
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

        {/* Lista de horarios por día */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => (
            <div key={dayIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  {daysOfWeek[dayIndex]}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({groupedSlots[dayIndex]?.length || 0} horarios)
                  </span>
                </h3>
              </div>

              {groupedSlots[dayIndex]?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {groupedSlots[dayIndex]
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((slot) => (
                    <div key={slot.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>

                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">
                                Capacidad: {slot.max_capacity}
                              </span>
                            </div>

                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              slot.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {slot.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Servicio:</strong> {slot.service_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(slot)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                              slot.is_active
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {slot.is_active ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            onClick={() => handleEdit(slot)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay horarios configurados para este día</p>
                </div>
              )}
            </div>
          ))}
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
                    Día de la Semana *
                  </label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
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