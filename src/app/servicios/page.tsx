'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/TarjetaServicios';
import { formatAge } from '@/lib/utils';

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
  promotion_id: number | null;
  promotion_title: string | null;
  discount_type: string | null;
  discount_value: number | null;
  promo_code: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ServiciosPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

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

  const fetchServices = async (page = 1, category = '', search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`/api/services?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.services);
        setPagination(data.pagination);
        
        // Obtener categorías únicas
        const uniqueCategories = [...new Set(data.services.map((s: Service) => s.category))] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(1, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  const handlePageChange = (newPage: number) => {
    fetchServices(newPage, selectedCategory, searchQuery);
  };

  const handleViewMore = (servicio: { id: number }) => {
    window.location.href = `/servicios/${servicio.id}`;
  };

  const handleBookNow = (servicio: { id: number }) => {
    // Redirigir directamente a la página de contratación
    router.push(`/dashboard/contratar/${servicio.id}`);
  };


  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
          className={`p-2 rounded-lg ${
            pagination.hasPrev 
              ? 'hover:bg-blue-50 text-gray-700' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg ${
              page === pagination.page
                ? 'text-white shadow-lg'
                : 'hover:bg-blue-50 text-gray-700'
            }`}
            style={{ 
              backgroundColor: page === pagination.page ? '#00B4E5' : '' 
            }}
          >
            {page}
          </button>
        ))}

        {endPage < pagination.pages && (
          <>
            {endPage < pagination.pages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(pagination.pages)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700"
            >
              {pagination.pages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
          className={`p-2 rounded-lg ${
            pagination.hasNext 
              ? 'hover:bg-blue-50 text-gray-700' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefefe' }}>
      <Navbar />
      
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
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00B4E5] focus:border-transparent shadow-sm bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button 
            onClick={() => setSelectedCategory('')}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '' 
                ? 'text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
            }`}
            style={{ backgroundColor: selectedCategory === '' ? '#00B4E5' : '' }}
          >
            Todos los Servicios
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedCategory === category ? '#00B4E5' : '' 
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-500 text-lg">Cargando servicios...</p>
          </div>
        )}

        {/* Services Grid */}
        {!loading && (
          <>
            {services.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map(service => (
                    <ServiceCard
                      key={service.id}
                      servicio={{
                        id: service.id,
                        nombre: service.name,
                        descripcion: service.short_description || service.description,
                        precio: service.price || 0,
                        categoria: service.category,
                        imagen: service.primary_image ?? '',
                        destacado: service.is_featured,
                        rating: 4.8,
                        edades: service.age_range_min && service.age_range_max
                          ? formatAge(service.age_range_min) + ' - ' + formatAge(service.age_range_max)
                          : "Todas las edades",
                        horario: service.duration ? `${service.duration} min` : "Consultar",
                        hasPromotion: !!service.promotion_id,
                        promotionTitle: service.promotion_title,
                        discountType: service.discount_type,
                        discountValue: service.discount_value
                      }}
                      onViewMore={handleViewMore}
                      onBookNow={handleBookNow}
                      isHighlighted={service.is_featured}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {renderPagination()}

                {/* Results Info */}
                <div className="text-center mt-8 text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} servicios
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">No se encontraron servicios que coincidan con tu búsqueda.</p>
                <p className="text-gray-400 text-sm mt-2">Intenta con otros términos de búsqueda o selecciona una categoría diferente.</p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer 
        parametros={parametros} 
        onPageChange={(page) => window.location.href = `/${page}`}
        handleWhatsAppContact={() => window.open(`https://wa.me/${parametros.whatsapp}?text=${encodeURIComponent("Hola, me interesa conocer más sobre los servicios del Centro Infantil DULMAR")}`, '_blank')}
      />

    </div>
  );
}