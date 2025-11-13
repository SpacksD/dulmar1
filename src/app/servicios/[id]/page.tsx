'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  Star,
  Baby,
  CheckCircle,
  Award,
  Target,
  Heart,
  Tag,
  Sparkles
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ServiceImage from '../../components/ServiceImage';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  age_range_min: number | null;
  age_range_max: number | null;
  duration: number | null;
  capacity: number | null;
  price: number | null;
  is_active: boolean;
  is_featured: boolean;
  primary_image: string | null;
  created_at: string;
  updated_at: string;
  promotion_id: number | null;
  promotion_title: string | null;
  promotion_description: string | null;
  discount_type: string | null;
  discount_value: number | null;
  promo_code: string | null;
  promotion_start_date: string | null;
  promotion_end_date: string | null;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const serviceId = params.id as string;

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Servicio no encontrado');
        } else {
          setError('Error al cargar el servicio');
        }
        return;
      }

      const data = await response.json();
      setService(data.service);
    } catch (error) {
      console.error('Error fetching service:', error);
      setError('Error al cargar el servicio');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const formatPrice = (price: number): string => {
    return `S/ ${price.toFixed(2)}`;
  };

  const formatAge = (months: number): string => {
    if (months < 12) {
      return `${months} meses`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'año' : 'años'}`;
      } else {
        return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} meses`;
      }
    }
  };

  const handleBookNow = () => {
    router.push(`/dashboard/contratar/${serviceId}`);
  };

  const parametros = {
    nombreEmpresa: "Centro Infantil DULMAR",
    slogan: "Brindamos seguridad, aprendizaje y salud infantil",
    telefono: "(01) 234-5678",
    email: "info@dulmar.com",
    horario: "Lunes a Viernes: 7:00 AM - 6:00 PM",
    direccion: "Av. Principal 123, Lima, Perú",
    whatsapp: "51987654321",
    directora: "Dra. María García"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer
          parametros={parametros}
          onPageChange={(page) => window.location.href = `/${page}`}
          handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}`, '_blank')}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/servicios')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a Servicios
            </button>
          </div>
        </div>
        <Footer
          parametros={parametros}
          onPageChange={(page) => window.location.href = `/${page}`}
          handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}`, '_blank')}
        />
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => router.push('/servicios')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Servicios
          </button>
          <span>/</span>
          <span className="text-gray-900">{service.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative">
              {service.promotion_id ? (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {service.promotion_title || 'PROMOCIÓN'}
                </div>
              ) : service.is_featured ? (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                  ⭐ DESTACADO
                </div>
              ) : null}
              <ServiceImage
                src={service.primary_image}
                alt={service.name}
                className="w-full h-80 object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>

          {/* Service Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {service.category}
                </span>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <span className="ml-1 text-gray-600 text-sm">(4.8)</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{service.short_description}</p>
            </div>

            {/* Promotion Banner */}
            {service.promotion_id && (
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-pink-900 mb-1 flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      {service.promotion_title}
                    </h3>
                    {service.promotion_description && (
                      <p className="text-pink-800 text-sm mb-3">{service.promotion_description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {service.discount_type && service.discount_value && (
                        <div className="bg-white px-4 py-2 rounded-lg border-2 border-pink-300">
                          <span className="text-2xl font-bold text-pink-600">
                            {service.discount_type === 'percentage' && `-${service.discount_value}%`}
                            {service.discount_type === 'fixed_amount' && `-S/. ${service.discount_value}`}
                            {service.discount_type === 'free_service' && 'GRATIS'}
                          </span>
                          <span className="text-xs text-pink-700 ml-2">de descuento</span>
                        </div>
                      )}
                      {service.promo_code && (
                        <div className="bg-white px-4 py-2 rounded-lg border-2 border-pink-300">
                          <span className="text-xs text-pink-700">Código:</span>
                          <span className="text-sm font-mono font-bold text-pink-900 ml-2">{service.promo_code}</span>
                        </div>
                      )}
                    </div>
                    {service.promotion_end_date && (
                      <p className="text-xs text-pink-700 mt-3">
                        ⏰ Válido hasta: {new Date(service.promotion_end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Service Features */}
            <div className="grid grid-cols-2 gap-4">
              {service.age_range_min && service.age_range_max && (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Baby className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Edades</p>
                    <p className="font-semibold text-gray-900">
                      {formatAge(service.age_range_min)} - {formatAge(service.age_range_max)}
                    </p>
                  </div>
                </div>
              )}

              {service.duration && (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duración</p>
                    <p className="font-semibold text-gray-900">{service.duration} minutos</p>
                  </div>
                </div>
              )}

              {service.capacity && (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacidad</p>
                    <p className="font-semibold text-gray-900">{service.capacity} niños</p>
                  </div>
                </div>
              )}

              {service.price && (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio</p>
                    <p className="font-bold text-xl text-gray-900">{formatPrice(service.price)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={handleBookNow}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Reservar Ahora
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-blue-600" />
            Descripción Detallada
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed text-lg">
              {service.description}
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Heart className="h-6 w-6 mr-2 text-red-600" />
            Beneficios del Servicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Estimulación Temprana</h3>
                <p className="text-gray-600">Desarrollo integral de habilidades cognitivas, motoras y sociales.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Profesionales Especializados</h3>
                <p className="text-gray-600">Equipo de expertos en desarrollo infantil y estimulación temprana.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Ambiente Seguro</h3>
                <p className="text-gray-600">Instalaciones adaptadas y seguras para el bienestar de los niños.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Seguimiento Personalizado</h3>
                <p className="text-gray-600">Atención individualizada según las necesidades de cada niño.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Dale a tu hijo la mejor oportunidad de desarrollar todo su potencial con nuestros servicios especializados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBookNow}
              className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reservar Ahora
            </button>
            <button
              onClick={() => window.open(`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent(`Hola, me interesa el servicio: ${service.name}`)}`, '_blank')}
              className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Consultar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      <Footer
        parametros={parametros}
        onPageChange={(page) => window.location.href = `/${page}`}
        handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}`, '_blank')}
      />
    </div>
  );
}