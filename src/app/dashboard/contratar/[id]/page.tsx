'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Star, CreditCard, User, Phone, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/app/components/ServiceImage';
import { calculateSessionPricing, calculateReducedSessionPricing, getSessionOptions, getPricingDescription } from '@/lib/pricing';

interface Service {
  id: number;
  name: string;
  description: string;
  short_description: string;
  category: string;
  age_range_min: number | null;
  age_range_max: number | null;
  duration: number | null;
  capacity: number | null;
  price: number;
  is_featured: boolean;
  primary_image: string;
  sessions_included: number;
  pricing_type: 'sessions' | 'fixed';
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
}

interface SubscriptionData {
  service_id: number;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  start_month: number;
  start_year: number;
  weekly_schedule: { [key: number]: number | null }; // Día de la semana (0-6) -> Schedule Slot ID
  sessions_per_month: number;
  special_requests: string;
  promotion_code?: string;
}

export default function ContratarServicioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  interface PricingCalculation {
    base_price: number;
    additional_price: number;
    total_price: number;
    base_sessions: number;
    additional_sessions: number;
  }

  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);

  const currentDate = new Date();
  const [formData, setFormData] = useState<SubscriptionData>({
    service_id: parseInt(serviceId),
    child_name: '',
    child_age: 12, // en meses
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    start_month: currentDate.getMonth() + 1, // mes actual
    start_year: currentDate.getFullYear(),
    weekly_schedule: {0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null}, // Domingo a Sábado
    sessions_per_month: 8, // Se actualizará cuando se cargue el servicio
    special_requests: '',
    promotion_code: ''
  });


  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const fetchService = useCallback(async () => {
    try {
      // Buscar el servicio en la lista de servicios
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        const serviceData = data.services.find((s: Service) => s.id === parseInt(serviceId));
        if (serviceData) {
          setService(serviceData);

          // Actualizar sessions_per_month con el valor del servicio
          const defaultSessions = serviceData.sessions_included || 8;
          setFormData(prev => ({
            ...prev,
            sessions_per_month: defaultSessions
          }));

          // Cargar horarios disponibles para este servicio
          await fetchScheduleSlots(serviceData.id);

          // Calcular precio inicial solo si es por sesiones
          if (serviceData.pricing_type === 'sessions') {
            calculatePricing(serviceData.price, defaultSessions);
          } else {
            // Para precio fijo, establecer directamente el precio
            setPricingCalculation({
              base_price: serviceData.price,
              additional_price: 0,
              total_price: serviceData.price,
              base_sessions: defaultSessions,
              additional_sessions: 0
            });
          }
        } else {
          setError('Servicio no encontrado');
        }
      } else {
        setError('Error al cargar el servicio');
      }
    } catch {
      setError('Error al cargar el servicio');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchService();
  }, [session, status, router, serviceId, fetchService]);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        parent_name: session.user.name || '',
        parent_email: session.user.email || ''
      }));
    }
  }, [session]);

  const fetchScheduleSlots = async (serviceId: number) => {
    try {
      const response = await fetch(`/api/schedule-slots?service_id=${serviceId}&active_only=true`);
      if (response.ok) {
        const data = await response.json();
        setScheduleSlots(data.slots);
      }
    } catch (error) {
      console.error('Error fetching schedule slots:', error);
    }
  };

  const calculatePricing = (basePrice: number, sessions: number) => {
    try {
      let calculation;
      if (sessions < 8) {
        calculation = calculateReducedSessionPricing(basePrice, sessions);
      } else {
        calculation = calculateSessionPricing(basePrice, sessions);
      }
      setPricingCalculation(calculation);
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === 'child_age' || name === 'start_month' || name === 'start_year' || name === 'sessions_per_month'
        ? parseInt(value) || 0
        : value
    };

    setFormData(newFormData);

    // Recalcular precio si cambia el número de sesiones y es tipo sesiones
    if (name === 'sessions_per_month' && service && service.pricing_type === 'sessions') {
      const sessions = parseInt(value) || service.sessions_included || 8;
      calculatePricing(service.price, sessions);
    }
  };

  const handleWeeklyScheduleChange = (dayOfWeek: number, slotId: number | null) => {
    setFormData(prev => ({
      ...prev,
      weekly_schedule: {
        ...prev.weekly_schedule,
        [dayOfWeek]: slotId
      }
    }));
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek] || 'Día desconocido';
  };

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatAge = (months: number): string => {
    if (months < 12) return `${months} meses`;
    if (months === 12) return '1 año';
    if (months < 24) return `1 año ${months - 12} meses`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths === 0 ? `${years} años` : `${years} años ${remainingMonths} meses`;
  };

  const formatPrice = (price: number): string => {
    return `S/ ${price.toFixed(2)}`;
  };

  const validateForm = (): boolean => {
    if (!formData.child_name.trim()) {
      setError('El nombre del niño/a es requerido');
      return false;
    }
    if (!formData.parent_phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    // Validar que al menos un día tenga un horario seleccionado
    const selectedDays = Object.values(formData.weekly_schedule).filter(slot => slot !== null);
    if (selectedDays.length === 0) {
      setError('Debe seleccionar al menos un horario para un día de la semana');
      return false;
    }
    if (service && service.age_range_min && service.age_range_max && (formData.child_age < service.age_range_min || formData.child_age > service.age_range_max)) {
      setError(`La edad del niño/a debe estar entre ${formatAge(service.age_range_min)} y ${formatAge(service.age_range_max)}`);
      return false;
    }

    // Validar que el mes/año de inicio no sea en el pasado
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (formData.start_year < currentYear ||
        (formData.start_year === currentYear && formData.start_month < currentMonth)) {
      setError('El mes de inicio debe ser el mes actual o futuro');
      return false;
    }

    if (formData.sessions_per_month < 4 || formData.sessions_per_month > 20) {
      setError('El número de sesiones por mes debe estar entre 4 y 20');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (!service) {
        setError('Servicio no disponible');
        setSubmitting(false);
        return;
      }
      const subscriptionData = {
        ...formData,
        base_monthly_price: service.price,
        final_monthly_price: service.pricing_type === 'fixed'
          ? service.price
          : (pricingCalculation ? pricingCalculation.total_price : service.price)
      };

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/mis-reservas');
        }, 3000);
      } else {
        setError(result.error || 'Error al crear la subscripción');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Servicio no encontrado</h1>
          <p className="text-gray-600 mt-2">El servicio que buscas no existe o no está disponible</p>
          <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Subscripción Creada!</h1>
            <p className="text-gray-600 mb-6">
              Tu solicitud de subscripción mensual ha sido enviada correctamente. Nuestro equipo se pondrá en contacto contigo para coordinar el horario específico de las sesiones.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido a tus subscripciones en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Subscripción Mensual</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Servicio */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              {/* Imagen del Servicio */}
              <div className="h-48 w-full bg-gray-100 relative">
                <ServiceImage
                  src={service.primary_image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {service.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Star className="h-6 w-6 text-yellow-400 fill-current bg-white rounded-full p-1" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h2>

                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-4">
                  {service.category}
                </span>

                <p className="text-gray-600 text-sm mb-6">{service.description}</p>

                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-3 text-gray-400" />
                    <span>
                      Edades: {
                        service.age_range_min && service.age_range_max
                          ? `${formatAge(service.age_range_min)} - ${formatAge(service.age_range_max)}`
                          : service.age_range_min
                            ? `Desde ${formatAge(service.age_range_min)}`
                            : service.age_range_max
                              ? `Hasta ${formatAge(service.age_range_max)}`
                              : "Todas las edades"
                      }
                    </span>
                  </div>
                  {service.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 text-gray-400" />
                      <span>Duración: {service.duration} minutos</span>
                    </div>
                  )}
                  {service.capacity && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>Capacidad: {service.capacity} niños</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  {service.pricing_type === 'fixed' ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium text-gray-900">Precio mensual:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                          <div className="text-xs text-green-700">
                            <p className="font-medium mb-1">
                              Precio fijo mensual
                            </p>
                            <p>
                              Incluye {service.sessions_included || 8} sesiones mensuales
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    pricingCalculation && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Precio base:</span>
                          <span className="text-lg text-gray-900">
                            {formatPrice(pricingCalculation.base_price)}
                          </span>
                        </div>

                        {pricingCalculation.additional_price > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Sesiones adicionales:</span>
                            <span className="text-lg text-gray-900">
                              +{formatPrice(pricingCalculation.additional_price)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-900">Precio total:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatPrice(pricingCalculation.total_price)}
                          </span>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                            <div className="text-xs text-blue-700">
                              <p className="font-medium mb-1">
                                {getPricingDescription(formData.sessions_per_month, service.price)}
                              </p>
                              <p>
                                {formData.sessions_per_month === (service.sessions_included || 8)
                                  ? `Precio estándar con ${service.sessions_included || 8} sesiones incluidas`
                                  : formData.sessions_per_month < (service.sessions_included || 8)
                                    ? `Precio reducido proporcional (${formData.sessions_per_month} sesiones)`
                                    : `Precio con sesiones adicionales (${pricingCalculation.additional_sessions} extra)`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Reserva */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Información de la Subscripción Mensual</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información del Niño/a */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información del Niño/a
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Niño/a *
                      </label>
                      <input
                        type="text"
                        name="child_name"
                        value={formData.child_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edad (en meses) *
                      </label>
                      <input
                        type="number"
                        name="child_age"
                        value={formData.child_age}
                        onChange={handleInputChange}
                        min={service.age_range_min || 1}
                        max={service.age_range_max || 60}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rango permitido: {
                          service.age_range_min && service.age_range_max
                            ? `${formatAge(service.age_range_min)} - ${formatAge(service.age_range_max)}`
                            : service.age_range_min
                              ? `Desde ${formatAge(service.age_range_min)}`
                              : service.age_range_max
                                ? `Hasta ${formatAge(service.age_range_max)}`
                                : "Todas las edades"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Padre/Madre */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Padre/Madre *
                      </label>
                      <input
                        type="text"
                        name="parent_name"
                        value={formData.parent_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="parent_email"
                        value={formData.parent_email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="parent_phone"
                        value={formData.parent_phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="+57 300 123 4567"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Configuración de Subscripción Mensual */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Configuración de Subscripción
                  </h3>

                  {/* Mes y Año de Inicio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mes de Inicio *
                      </label>
                      <select
                        name="start_month"
                        value={formData.start_month}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        {monthNames.map((month, index) => {
                          const monthValue = index + 1;
                          const currentMonth = new Date().getMonth() + 1;
                          const currentYear = new Date().getFullYear();

                          // Deshabilitar meses pasados del año actual
                          const isDisabled = formData.start_year === currentYear && monthValue < currentMonth;

                          return (
                            <option key={monthValue} value={monthValue} disabled={isDisabled}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año *
                      </label>
                      <select
                        name="start_year"
                        value={formData.start_year}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        {[currentDate.getFullYear(), currentDate.getFullYear() + 1].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Horario Semanal */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Horario Semanal *
                    </label>

                    {scheduleSlots.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-yellow-700 font-medium mb-1">
                              No hay horarios disponibles
                            </p>
                            <p className="text-yellow-600 text-sm">
                              Por el momento no hay horarios configurados para este servicio.
                              Nuestro equipo se pondrá en contacto contigo para coordinar el horario.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Cuadrícula de días de la semana */}
                        {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                          const dayName = getDayName(dayOfWeek);
                          const availableSlots = scheduleSlots.filter(slot => slot.day_of_week === dayOfWeek);
                          const selectedSlotId = formData.weekly_schedule[dayOfWeek];

                          return (
                            <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  {dayName}
                                </h4>
                                {selectedSlotId && (
                                  <button
                                    type="button"
                                    onClick={() => handleWeeklyScheduleChange(dayOfWeek, null)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Limpiar
                                  </button>
                                )}
                              </div>

                              {availableSlots.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">
                                  No hay horarios disponibles este día
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <select
                                    value={selectedSlotId || ''}
                                    onChange={(e) => handleWeeklyScheduleChange(
                                      dayOfWeek,
                                      e.target.value ? parseInt(e.target.value) : null
                                    )}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
                                  >
                                    <option value="">
                                      Seleccionar horario...
                                    </option>
                                    {availableSlots.map(slot => (
                                      <option key={slot.id} value={slot.id}>
                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        (Cap: {slot.max_capacity})
                                      </option>
                                    ))}
                                  </select>

                                  {selectedSlotId && (
                                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Horario seleccionado
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                        <div className="text-xs text-blue-700">
                          <p className="font-medium mb-1">Horario Flexible</p>
                          <p>
                            Puedes seleccionar diferentes horarios para cada día de la semana.
                            Solo selecciona los días que necesites.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Número de Sesiones por Mes - Solo para servicios de tipo sesiones */}
                  {service.pricing_type === 'sessions' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sesiones por Mes *
                      </label>
                      <select
                        name="sessions_per_month"
                        value={formData.sessions_per_month}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        {getSessionOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </option>
                        ))}
                      </select>

                      {pricingCalculation && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600">
                            <p className="font-medium text-gray-900 mb-1">Detalles del precio:</p>
                            <div className="space-y-1">
                              <p>• Sesiones base: {pricingCalculation.base_sessions}</p>
                              {pricingCalculation.additional_sessions > 0 && (
                                <p>• Sesiones adicionales: {pricingCalculation.additional_sessions}</p>
                              )}
                              <p className="font-medium text-blue-600">
                                • Total: {formatPrice(pricingCalculation.total_price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        💡 Recomendamos {service.sessions_included || 8} sesiones para un desarrollo óptimo
                      </p>
                    </div>
                  )}

                </div>

                {/* Solicitudes Especiales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solicitudes Especiales
                  </label>
                  <textarea
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Alguna necesidad especial, alergias, o comentarios adicionales..."
                  />
                </div>

                {/* Código de Promoción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Promoción (Opcional)
                  </label>
                  <input
                    type="text"
                    name="promotion_code"
                    value={formData.promotion_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Ingresa tu código de descuento"
                  />
                </div>

                {/* Botón de Envío */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                      submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Crear Subscripción - {service.pricing_type === 'fixed' ? formatPrice(service.price) : (pricingCalculation ? formatPrice(pricingCalculation.total_price) : formatPrice(service.price))}/mes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}