'use client';

import React, { JSX, useState } from 'react';
import { Search, Phone, Mail, Clock, MapPin, User, LogIn, Menu, X, } from 'lucide-react';

// Importar componentes
import Footer from '../components/Footer';
import ServiceCard from '../components/TarjetaServicios';
import TestimonialsSection from '../components/Testimonios';
import WhyChooseDulmar from '../components/Porque';

// Importar tipos
import type { Servicio } from '../components/TarjetaServicios';

// Definir tipos para parámetros del sistema
interface Parametros {
  nombreEmpresa: string;
  slogan: string;
  telefono: string;
  email: string;
  horario: string;
  direccion: string;
  whatsapp: string;
  directora: string;
}

const DulmarLandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<string>('inicio');

  // Datos del centro infantil
  const servicios: Servicio[] = [
    {
      id: 1,
      nombre: "Educación Inicial (3-5 años)",
      descripcion: "Programa educativo integral para el desarrollo cognitivo y social de los niños",
      precio: 450,
      categoria: "Educación",
      imagen: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=250&fit=crop",
      destacado: true,
      rating: 4.9,
      edades: "3-5 años",
      horario: "8:00 AM - 1:00 PM"
    },
    {
      id: 2,
      nombre: "Guardería Integral",
      descripcion: "Cuidado y atención personalizada para bebés y niños pequeños",
      precio: 380,
      categoria: "Cuidado",
      imagen: "https://images.unsplash.com/photo-1544776527-dbb881ade19a?w=400&h=250&fit=crop",
      destacado: true,
      rating: 4.8,
      edades: "6 meses - 3 años",
      horario: "7:00 AM - 6:00 PM"
    },
    {
      id: 3,
      nombre: "Talleres de Arte y Creatividad",
      descripcion: "Desarrollo de habilidades artísticas y expresión creativa",
      precio: 120,
      categoria: "Arte",
      imagen: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=250&fit=crop",
      destacado: false,
      rating: 4.7,
      edades: "2-6 años",
      horario: "Martes y Jueves 3:00 PM"
    },
    {
      id: 4,
      nombre: "Estimulación Temprana",
      descripcion: "Actividades especializadas para el desarrollo neuromotor",
      precio: 200,
      categoria: "Desarrollo",
      imagen: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=250&fit=crop",
      destacado: false,
      rating: 4.9,
      edades: "0-3 años",
      horario: "Lunes, Miércoles, Viernes"
    },
    {
      id: 5,
      nombre: "Música y Movimiento",
      descripcion: "Clases de música, canto y psicomotricidad",
      precio: 100,
      categoria: "Música",
      imagen: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
      destacado: false,
      rating: 4.6,
      edades: "1-5 años",
      horario: "Todos los días 10:00 AM"
    },
    {
      id: 6,
      nombre: "Apoyo Nutricional",
      descripcion: "Alimentación balanceada y nutritiva preparada con amor",
      precio: 80,
      categoria: "Nutrición",
      imagen: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop",
      destacado: true,
      rating: 4.8,
      edades: "Todas las edades",
      horario: "Desayuno, Almuerzo, Lonche"
    }
  ];

  const categorias: string[] = [...new Set(servicios.map(s => s.categoria))];
  
  const parametros: Parametros = {
    nombreEmpresa: "Centro Infantil DULMAR",
    slogan: "Brindamos seguridad, aprendizaje y salud infantil",
    telefono: "+51 993 521 250",
    email: "centrodulmar@gmail.com",
    horario: "Lun - Vie: 7:00 AM - 6:00 PM | Sáb: 8:00 AM - 2:00 PM",
    direccion: "Calle los rosales N° 125, Casa Grande - Ascope - la Libertad",
    whatsapp: "51993521250",
    directora: "Lic. María Elena Dulanto"
  };

  const filteredServicios: Servicio[] = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    servicio.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWhatsAppContact = (): void => {
    const message = encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR para mi pequeño");
    window.open(`https://wa.me/${parametros.whatsapp}?text=${message}`, '_blank');
  };

  const handleViewMore = (servicio: Servicio): void => {
    alert(`Más información sobre: ${servicio.nombre}`);
  };

  const handlePageChange = (page: string): void => {
    setCurrentPage(page);
  };

  // Página de Servicios
  const ServiciosPage: React.FC = () => (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos servicios integrales para el cuidado, educación y desarrollo de tu pequeño
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent shadow-sm bg-white"
              style={{ border: '#00B4E5' }}
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button 
            onClick={() => setSearchQuery('')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
              searchQuery === '' 
                ? 'text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
            }`}
            style={{ backgroundColor: searchQuery === '' ? '#00B4E5' : '' }}
          >
            Todos los Servicios
          </button>
          {categorias.map(categoria => (
            <button
              key={categoria}
              onClick={() => setSearchQuery(categoria)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                searchQuery.toLowerCase() === categoria.toLowerCase()
                  ? 'text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
              }`}
              style={{ 
                backgroundColor: searchQuery.toLowerCase() === categoria.toLowerCase() ? '#00B4E5' : '' 
              }}
            >
              {categoria}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServicios.map(servicio => (
            <ServiceCard 
              key={servicio.id} 
              servicio={servicio} 
              onViewMore={handleViewMore}
              isHighlighted={servicio.destacado}
            />
          ))}
        </div>

        {filteredServicios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-500 text-lg">No se encontraron servicios que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Página de Contacto
  const ContactoPage: React.FC = () => (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
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
              <button 
                onClick={handleWhatsAppContact}
                className="w-full text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#619A31' }}
              >
                <Phone className="h-6 w-6 mr-3" />
                Contactar por WhatsApp
              </button>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un Mensaje</h2>
            
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Padre/Madre *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                    placeholder="999 888 777"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="tu.email@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Niño/a
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                    placeholder="Nombre de tu pequeño"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Edad del Niño/a
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent">
                    <option>Seleccionar edad</option>
                    <option>6 meses - 1 año</option>
                    <option>1 - 2 años</option>
                    <option>2 - 3 años</option>
                    <option>3 - 4 años</option>
                    <option>4 - 5 años</option>
                    <option>5 - 6 años</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Servicio de Interés
                </label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent">
                  <option>Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id}>{servicio.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="Cuéntanos sobre las necesidades específicas de tu pequeño o cualquier pregunta que tengas..."
                />
              </div>

              <button
                type="submit"
                className="w-full text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#00B4E5' }}
              >
                Enviar Mensaje
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
    </div>
  );

  // Página de inicio
  const HomePage: React.FC = () => (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      {/* Hero Section con imagen de fondo */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: 'url(/img/bg_navideño.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay para mejorar la legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/70 to-indigo-900/70"></div>
        
        {/* Contenido */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo simulado */}
            <div className="mb-8 flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/30">
                <div className="text-6xl mb-2">🏰</div>
                <div className="text-2xl font-bold">DULMAR</div>
                <div className="text-sm opacity-90">Centro Infantil</div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Centro Infantil <span className="text-blue-200">DULMAR</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {parametros.slogan}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleWhatsAppContact}
                className="text-white px-8 py-4 rounded-2xl text-lg font-semibold flex items-center transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                style={{ backgroundColor: '#619A31' }}
              >
                <Phone className="h-6 w-6 mr-2" />
                Contactar por WhatsApp
              </button>
              <button 
                onClick={() => setCurrentPage('servicios')}
                className="bg-white hover:bg-blue-50 px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                style={{ color: '#00B4E5' }}
              >
                Ver Nuestros Servicios
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Destacados */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Servicios Destacados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Programas diseñados especialmente para el desarrollo integral de tu pequeño
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.filter(s => s.destacado).map(servicio => (
              <ServiceCard 
                key={servicio.id} 
                servicio={servicio} 
                onViewMore={handleViewMore}
                isHighlighted={true}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => setCurrentPage('servicios')}
              className="text-white px-8 py-3 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: '#00B4E5' }}
            >
              Ver Todos los Servicios
            </button>
          </div>
        </div>
      </section>

      {/* Componente ¿Por qué elegir DULMAR? */}
      <WhyChooseDulmar />

      {/* Componente Testimonios */}
      <TestimonialsSection />
    </div>
  );

  // Renderizar página actual
  const renderPage = (): JSX.Element => {
    switch(currentPage) {
      case 'servicios':
        return <ServiciosPage />;
      case 'contacto':
        return <ContactoPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2" style={{ borderBottomColor: '#00B4E5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('inicio')}>
              <div className="flex-shrink-0 flex items-center">
                <div className="text-2xl mr-2">🏰</div>
                <div>
                  <span className="text-xl font-bold text-gray-800">
                    DULMAR
                  </span>
                  <div className="text-xs text-gray-500">Centro Infantil</div>
                </div>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <button 
                  onClick={() => setCurrentPage('inicio')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === 'inicio' 
                      ? 'border-b-2' 
                      : 'text-gray-700'
                  }`}
                  style={{ 
                    color: currentPage === 'inicio' ? '#00B4E5' : '',
                    borderBottomColor: currentPage === 'inicio' ? '#00B4E5' : ''
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 'inicio') {
                      e.currentTarget.style.color = '#00B4E5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 'inicio') {
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  Inicio
                </button>
                <button 
                  onClick={() => setCurrentPage('servicios')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === 'servicios' 
                      ? 'border-b-2' 
                      : 'text-gray-700'
                  }`}
                  style={{ 
                    color: currentPage === 'servicios' ? '#00B4E5' : '',
                    borderBottomColor: currentPage === 'servicios' ? '#00B4E5' : ''
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 'servicios') {
                      e.currentTarget.style.color = '#00B4E5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 'servicios') {
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  Servicios
                </button>
                <button 
                  onClick={() => setCurrentPage('contacto')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    currentPage === 'contacto' 
                      ? 'border-b-2' 
                      : 'text-gray-700'
                  }`}
                  style={{ 
                    color: currentPage === 'contacto' ? '#00B4E5' : '',
                    borderBottomColor: currentPage === 'contacto' ? '#00B4E5' : ''
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 'contacto') {
                      e.currentTarget.style.color = '#00B4E5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 'contacto') {
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  Contacto
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => alert('Función de registro próximamente')}
                className="text-white border-2 px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg hover:shadow-xl"
                style={{ 
                  borderColor: '#00B4E5',
                  color: '#00B4E5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00B4E5';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#00B4E5';
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Registrarse
              </button>
              <button 
                className="text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#00B4E5' }}
              >
                <User className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                <button 
                  onClick={() => {setCurrentPage('inicio'); setIsMenuOpen(false);}}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600"
                >
                  Inicio
                </button>
                <button 
                  onClick={() => {setCurrentPage('servicios'); setIsMenuOpen(false);}}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                >
                  Servicios
                </button>
                <button 
                  onClick={() => {setCurrentPage('contacto'); setIsMenuOpen(false);}}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                >
                  Contacto
                </button>
                <button 
                  onClick={() => {alert('Función de registro próximamente'); setIsMenuOpen(false);}}
                  className="w-full mt-2 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center border-2"
                  style={{ 
                    borderColor: '#F83797',
                    color: '#F83797'
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Registrarse
                </button>
                <button 
                  className="w-full mt-2 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center"
                  style={{ backgroundColor: '#00B4E5' }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Renderizar página actual */}
      {renderPage()}

      {/* Footer Component */}
      <Footer 
        parametros={parametros} 
        onPageChange={handlePageChange} 
        handleWhatsAppContact={handleWhatsAppContact}
      />
    </div>
  );
};

export default DulmarLandingPage;