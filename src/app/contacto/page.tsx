'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, Clock, MapPin, User, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  child_name: string;
  child_age: string;
  subject: string;
  message: string;
  interested_services: number[];
  preferred_contact_method: 'email' | 'phone' | 'whatsapp';
}

export default function ContactoPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    child_name: '',
    child_age: '',
    subject: '',
    message: '',
    interested_services: [],
    preferred_contact_method: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const parametros = {
    nombreEmpresa: "Centro Infantil DULMAR",
    slogan: "Brindamos seguridad, aprendizaje y salud infantil",
    telefono: "+51 987 654 321",
    email: "info@centroinfantildulmar.com",
    horario: "Lun - Vie: 7:00 AM - 6:00 PM | Sáb: 8:00 AM - 2:00 PM",
    direccion: "Jr. Los Tulipanes 456, San Juan de Miraflores, Lima",
    whatsapp: "51987654321",
    directora: "Lic. María Elena Dulanto"
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?limit=50');
      const data = await response.json();
      if (response.ok) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      interested_services: prev.interested_services.includes(serviceId)
        ? prev.interested_services.filter(id => id !== serviceId)
        : [...prev.interested_services, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convertir child_age si es necesario
      const submitData = {
        ...formData,
        child_age: formData.child_age ? getAgeInMonths(formData.child_age) : null,
        interested_services: formData.interested_services.length > 0 ? formData.interested_services : null
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          child_name: '',
          child_age: '',
          subject: '',
          message: '',
          interested_services: [],
          preferred_contact_method: 'email'
        });
      } else {
        setError(data.error || 'Error al enviar el mensaje');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getAgeInMonths = (ageRange: string): number => {
    const ageMap: { [key: string]: number } = {
      '6 meses - 1 año': 9,
      '1 - 2 años': 18,
      '2 - 3 años': 30,
      '3 - 4 años': 42,
      '4 - 5 años': 54,
      '5 - 6 años': 66
    };
    return ageMap[ageRange] || 12;
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center bg-white rounded-2xl shadow-lg p-12">
            <CheckCircle className="h-20 w-20 mx-auto mb-6" style={{ color: '#619A31' }} />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Mensaje Enviado!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Gracias por contactarnos. Nos pondremos en contacto contigo muy pronto.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setSubmitted(false)}
                className="text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl mr-4"
                style={{ backgroundColor: '#00B4E5' }}
              >
                Enviar Otro Mensaje
              </button>
              <Link
                href="/"
                className="bg-white border-2 px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl inline-block"
                style={{ borderColor: '#00B4E5', color: '#00B4E5' }}
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
        <Footer 
          parametros={parametros} 
          onPageChange={(page) => window.location.href = `/${page}`}
          handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR")}`, '_blank')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para resolver todas tus dudas sobre el cuidado y educación de tu pequeño
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Información de Contacto</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00B4E5' }}>
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Teléfono</h3>
                  <p className="text-gray-600">{parametros.telefono}</p>
                  <p className="text-sm text-gray-500">Llamadas y mensajes</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#619A31' }}>
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">{parametros.email}</p>
                  <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E4E13C' }}>
                  <Clock className="h-6 w-6 text-gray-800" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Horarios de Atención</h3>
                  <p className="text-gray-600">{parametros.horario}</p>
                  <p className="text-sm text-gray-500">Horarios flexibles disponibles</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F83797' }}>
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
                  <p className="text-gray-600">{parametros.direccion}</p>
                  <p className="text-sm text-gray-500">Zona segura y accesible</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00B4E5' }}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Directora</h3>
                  <p className="text-gray-600">{parametros.directora}</p>
                  <p className="text-sm text-gray-500">Educadora especializada</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <a 
                href={`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR")}`}
                target="_blank"
                className="w-full text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#619A31' }}
              >
                <Phone className="h-6 w-6 mr-3" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un Mensaje</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Tu apellido"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="tu.email@ejemplo.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="999 888 777"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Niño/a
                  </label>
                  <input
                    type="text"
                    name="child_name"
                    value={formData.child_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Nombre de tu pequeño"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Edad del Niño/a
                  </label>
                  <select 
                    name="child_age"
                    value={formData.child_age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                  >
                    <option value="">Seleccionar edad</option>
                    <option value="6 meses - 1 año">6 meses - 1 año</option>
                    <option value="1 - 2 años">1 - 2 años</option>
                    <option value="2 - 3 años">2 - 3 años</option>
                    <option value="3 - 4 años">3 - 4 años</option>
                    <option value="4 - 5 años">4 - 5 años</option>
                    <option value="5 - 6 años">5 - 6 años</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="Asunto del mensaje"
                />
              </div>

              {/* Servicios de interés */}
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Servicios de Interés (opcional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.interested_services.includes(service.id)}
                          onChange={() => handleServiceChange(service.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Método de Contacto Preferido
                </label>
                <select 
                  name="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900"
                >
                  <option value="email">Email</option>
                  <option value="phone">Teléfono</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Cuéntanos sobre las necesidades específicas de tu pequeño o cualquier pregunta que tengas..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: '#00B4E5' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6 mr-3" />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Mapa o información adicional */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">¿Cómo llegar?</h2>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4" style={{ color: '#00B4E5' }} />
            <p className="text-gray-700 text-lg font-medium mb-2">{parametros.direccion}</p>
            <p className="text-gray-600 mb-4">Referencias: Cerca al parque principal de San Juan de Miraflores</p>
            <p className="text-sm text-gray-500">
              🚌 Acceso fácil en transporte público | 🚗 Zona de estacionamiento disponible
            </p>
          </div>
        </div>
      </div>

      <Footer 
        parametros={parametros} 
        onPageChange={(page) => window.location.href = `/${page}`}
        handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR")}`, '_blank')}
      />
    </div>
  );
}