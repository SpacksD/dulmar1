'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, Star, MapPin, Phone, Mail, ArrowRight, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/app/components/ServiceImage';

interface Service {
  id: number;
  name: string;
  description: string;
  short_description: string;
  category: string;
  age_range_min: number;
  age_range_max: number;
  duration: number;
  capacity: number;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  primary_image: string;
}

interface Booking {
  id: number;
  booking_code: string;
  service_name: string;
  child_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  final_price: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Categorías disponibles
  const categories = [
    { id: 'all', name: 'Todos los Servicios' },
    { id: 'Cuidado Diario', name: 'Cuidado Diario' },
    { id: 'Educación Temprana', name: 'Educación Temprana' },
    { id: 'Actividades Recreativas', name: 'Actividades Recreativas' },
    { id: 'Cuidado Especial', name: 'Cuidado Especial' },
    { id: 'Talleres', name: 'Talleres' },
    { id: 'Eventos', name: 'Eventos' }
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/bookings')
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services.filter((service: Service) => service.is_active));
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setMyBookings(bookingsData.bookings.slice(0, 3)); // Mostrar solo las últimas 3
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Bienvenido/a, {session?.user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Descubre y contrata nuestros servicios de estimulación temprana
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/mis-reservas"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mis Reservas
              </Link>
              <Link
                href="/dashboard/pagos"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Pagos y Recibos
              </Link>
              <Link
                href="/dashboard/perfil"
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Mi Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mis Reservas Recientes */}
        {myBookings.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Mis Reservas Recientes</h2>
              <Link
                href="/dashboard/mis-reservas"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.service_name}</h3>
                      <p className="text-sm text-gray-600">Código: {booking.booking_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {booking.child_name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(booking.preferred_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {booking.preferred_time}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        {formatPrice(booking.final_price)}
                      </span>
                      <Link
                        href={`/dashboard/reserva/${booking.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Servicios Disponibles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios Disponibles</h2>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron servicios que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                  {/* Imagen del Servicio */}
                  <Link href={`/dashboard/servicio/${service.id}`}>
                    <div className="h-48 w-full bg-gray-100 relative cursor-pointer hover:opacity-90 transition-opacity">
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
                  </Link>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Link href={`/dashboard/servicio/${service.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">{service.name}</h3>
                        </Link>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {service.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {service.short_description || service.description}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Edades: {formatAge(service.age_range_min)} - {formatAge(service.age_range_max)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Duración: {service.duration} minutos
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Capacidad: {service.capacity} niños
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(service.price)}
                      </div>
                      <Link
                        href={`/dashboard/contratar/${service.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Contratar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de Contacto */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">¿Necesitas Ayuda?</h2>
            <p className="text-blue-100 mb-6">
              Nuestro equipo está aquí para ayudarte a encontrar el mejor servicio para tu hijo/a
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>+57 300 123 4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>info@dulmar.com</span>
              </div>
              <Link
                href="/contacto"
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}