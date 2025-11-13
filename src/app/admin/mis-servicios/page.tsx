'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Calendar, Clock, Users, DollarSign, Phone, Star, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  description: string;
  short_description: string;
  category: string;
  price: number;
  duration: number;
  capacity: number;
  primary_image: string;
}

interface UserService {
  id: number;
  service: Service;
  status: 'active' | 'pending' | 'cancelled';
  start_date: string;
  end_date: string;
  monthly_fee: number;
}

export default function MisServiciosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);

  useEffect(() => {
    if (!session || session.user.role !== 'parent') {
      router.push('/admin');
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available services
      const servicesRes = await fetch('/api/services?active=true');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setAvailableServices(servicesData.services);
      }

      // Mock user services data (replace with real API when implemented)
      setUserServices([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContractService = async (serviceId: number) => {
    if (!confirm('¿Deseas contratar este servicio?')) return;

    // Mock implementation - replace with real API
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      const newUserService: UserService = {
        id: Date.now(),
        service,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
        monthly_fee: service.price
      };
      
      setUserServices([...userServices, newUserService]);
      alert('Solicitud de contratación enviada. Nos pondremos en contacto contigo pronto.');
    }
  };

  const handleCancelService = async (serviceId: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este servicio?')) return;

    setUserServices(userServices.map(us => 
      us.id === serviceId ? { ...us, status: 'cancelled' as const } : us
    ));
    alert('Servicio cancelado exitosamente.');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      active: 'Activo',
      pending: 'Pendiente',
      cancelled: 'Cancelado'
    };
    
    return {
      style: styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800',
      label: labels[status as keyof typeof labels] || status
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Servicios</h1>
        <p className="text-gray-600">Gestiona los servicios contratados para tu pequeño</p>
      </div>

      {/* Toggle between contracted and available services */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAvailable(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showAvailable 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mis Servicios Contratados ({userServices.length})
          </button>
          <button
            onClick={() => setShowAvailable(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAvailable 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Servicios Disponibles ({availableServices.length})
          </button>
        </div>
      </div>

      {!showAvailable ? (
        /* Contracted Services */
        <div>
          {userServices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Aún no tienes servicios contratados
                </h2>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Explora nuestros servicios disponibles y encuentra el mejor para tu pequeño
                </p>
                <button
                  onClick={() => setShowAvailable(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ver Servicios Disponibles
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userServices.map((userService) => {
                const status = getStatusBadge(userService.status);
                return (
                  <div key={userService.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {userService.service.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.style}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-800">
                            {formatPrice(userService.monthly_fee)}
                          </p>
                          <p className="text-sm text-gray-500">por mes</p>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">
                        {userService.service.short_description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Inicio: {new Date(userService.start_date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {userService.service.duration} min
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        {userService.status === 'active' && (
                          <button
                            onClick={() => handleCancelService(userService.id)}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                          >
                            Cancelar Servicio
                          </button>
                        )}
                        
                        <a
                          href={`https://wa.me/51993521250?text=${encodeURIComponent(`Consulta sobre el servicio: ${userService.service.name}`)}`}
                          target="_blank"
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Contactar
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Available Services */
        <div>
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Información importante</p>
                <p className="text-blue-700 text-sm mt-1">
                  Al contratar un servicio, nos pondremos en contacto contigo para coordinar los detalles de inicio y pago.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {service.primary_image && (
                  <div className="relative w-full h-48">
                    <Image
                      src={service.primary_image}
                      alt={service.name}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {service.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.short_description || service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatPrice(service.price)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.duration} min
                    </div>
                    <div className="flex items-center col-span-2">
                      <Users className="h-4 w-4 mr-1" />
                      Capacidad: {service.capacity} niños
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleContractService(service.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Contratar
                    </button>
                    
                    <a
                      href={`https://wa.me/51993521250?text=${encodeURIComponent(`Consulta sobre el servicio: ${service.name}`)}`}
                      target="_blank"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {availableServices.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-500 text-lg">No hay servicios disponibles en este momento</div>
              <p className="text-gray-400 mt-2">
                Por favor vuelve más tarde o contacta con nosotros para más información.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}