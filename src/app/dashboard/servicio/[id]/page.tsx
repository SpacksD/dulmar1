'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Users, MapPin, Star, CreditCard, Share2, CheckCircle } from 'lucide-react';
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
  is_featured: boolean;
  primary_image: string;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
}

export default function ServicioDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchService = useCallback(async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        const serviceData = data.services.find((s: Service) => s.id === parseInt(serviceId));
        if (serviceData) {
          setService(serviceData);
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
  }, [session, status, router, fetchService]);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.name,
          text: service?.short_description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !service) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Detalle del Servicio</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Compartir servicio"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {/* Imagen Principal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="h-64 md:h-96 w-full bg-gray-100 relative">
                <ServiceImage
                  src={service.primary_image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {service.is_featured && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      Destacado
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Información del Servicio */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {service.category}
                  </span>
                </div>
              </div>

              {service.short_description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Resumen</h2>
                  <p className="text-gray-600 text-lg leading-relaxed">{service.short_description}</p>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción Completa</h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {service.description || 'Este servicio está diseñado especialmente para el desarrollo integral de tu pequeño/a. Nuestro equipo especializado brinda atención personalizada y de calidad.'}
                  </p>
                </div>
              </div>

              {/* Características del Servicio */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">¿Qué incluye este servicio?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Atención personalizada</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Materiales especializados</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Seguimiento del progreso</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Reporte a los padres</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar de Información */}
          <div className="lg:col-span-1">
            {/* Información Rápida */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Servicio</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Edades</p>
                    <p className="font-medium text-gray-900">
                      {formatAge(service.age_range_min)} - {formatAge(service.age_range_max)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Duración</p>
                    <p className="font-medium text-gray-900">{service.duration} minutos</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Capacidad</p>
                    <p className="font-medium text-gray-900">{service.capacity} niños máximo</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-medium text-gray-900">Precio:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(service.price)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Por sesión</p>
              </div>

              <Link
                href={`/dashboard/contratar/${service.id}`}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Reservar Ahora
              </Link>
            </div>

            {/* Información Adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Tienes Preguntas?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Nuestro equipo está aquí para ayudarte a encontrar el mejor servicio para tu hijo/a.
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:centrodulmar@gmail.com"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  📧 centrodulmar@gmail.com
                </a>
                <a
                  href="tel:+573001234567"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  📞 +57 300 123 4567
                </a>
                <Link
                  href="/contacto"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  💬 Enviar Mensaje
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}