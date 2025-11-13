'use client';

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Phone } from 'lucide-react';
import ServiceCard from './components/TarjetaServicios';
import TestimonialsSection from './components/Testimonios';
import WhyChooseDulmar from './components/Porque';
import PromotionsModal, { FloatingPromotionsButton } from './components/PromotionsModal';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  short_description?: string;
  description: string;
  price: number;
  category: string;
  primary_image: string;
  is_featured: boolean;
  age_range_min?: number;
  age_range_max?: number;
  duration?: number;
  hasPromotion?: boolean;
  promotionTitle?: string;
  discountType?: string;
  discountValue?: number;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [showPromotionsModal, setShowPromotionsModal] = useState(false);
  const [hasSeenPromotions, setHasSeenPromotions] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services?featured=true&limit=3');
        if (res.ok) {
          const data = await res.json();
          setServices(data.services);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPromotions = async () => {
      try {
        const res = await fetch('/api/promotions?featured=true&active=true&limit=3');
        if (res.ok) {
          const data = await res.json();
          setPromotions(data.promotions);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
      } finally {
        setPromotionsLoading(false);
      }
    };

    fetchServices();
    fetchPromotions();
  }, []);

  // Auto-show promotions modal on page load if there are promotions
  useEffect(() => {
    if (!promotionsLoading && promotions.length > 0 && !hasSeenPromotions) {
      const timer = setTimeout(() => {
        setShowPromotionsModal(true);
        setHasSeenPromotions(true);
      }, 1500); // Show after 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [promotionsLoading, promotions, hasSeenPromotions]);

  const parametros = {
    nombreEmpresa: "Centro Infantil DULMAR",
    slogan: "Brindamos seguridad, aprendizaje y salud infantil",
    telefono: "+51 993 521 250",
    email: "centrodulmar@gmail.com",
    horario: "Lun - Vie: 7:00 AM - 6:00 PM | Sáb: 8:00 AM - 2:00 PM",
    direccion: "Calle los rosales N° 125, Casa Grande - Ascope - la Libertad",
    whatsapp: "51993521250",
    directora: "Lic. María Elena Dulanto"
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: 'url(/img/bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/70 to-indigo-900/70"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
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
              <Link 
                href={`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR para mi pequeño")}`}
                target="_blank"
                className="text-white px-8 py-4 rounded-2xl text-lg font-semibold flex items-center transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                style={{ backgroundColor: '#619A31' }}
              >
                <Phone className="h-6 w-6 mr-2" />
                Contactar por WhatsApp
              </Link>
              <Link
                href="/servicios"
                className="bg-white hover:bg-blue-50 px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                style={{ color: '#00B4E5' }}
              >
                Ver Nuestros Servicios
              </Link>
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

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando servicios destacados...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((servicio) => (
                <ServiceCard 
                  key={servicio.id} 
                  servicio={{
                    id: servicio.id,
                    nombre: servicio.name,
                    descripcion: servicio.short_description || servicio.description,
                    precio: servicio.price || 0,
                    categoria: servicio.category,
                    imagen: servicio.primary_image,
                    destacado: servicio.is_featured,
                    rating: 4.8,
                    edades: servicio.age_range_min && servicio.age_range_max 
                      ? `${servicio.age_range_min}-${servicio.age_range_max} meses`
                      : "Todas las edades",
                    horario: servicio.duration ? `${servicio.duration} min` : "Consultar"
                  }}
                  onViewMore={(servicio) => window.location.href = `/servicios/${servicio.id}`}
                  isHighlighted={true}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              href="/servicios"
              className="text-white px-8 py-3 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-block"
              style={{ backgroundColor: '#00B4E5' }}
            >
              Ver Todos los Servicios
            </Link>
          </div>
        </div>
      </section>


      <WhyChooseDulmar />
      <TestimonialsSection />
      
      <Footer 
        parametros={parametros} 
        onPageChange={(page) => window.location.href = `/${page}`}
        handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR")}`, '_blank')}
      />

      {/* Floating Promotions Button */}
      <FloatingPromotionsButton
        onClick={() => setShowPromotionsModal(true)}
        hasPromotions={!promotionsLoading && promotions.length > 0}
      />

      {/* Promotions Modal */}
      <PromotionsModal
        promotions={promotions}
        isOpen={showPromotionsModal}
        onClose={() => setShowPromotionsModal(false)}
      />
    </div>
  );
}
