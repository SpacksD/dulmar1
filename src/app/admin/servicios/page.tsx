'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Plus, Edit, Trash2, Image as ImageIc, Eye, Search, Filter } from 'lucide-react';
import { formatPrice, formatAge } from '@/lib/utils';

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
}

export default function ServicesAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        active: showOnlyActive.toString()
      });
      
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/services?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showOnlyActive]);

  useEffect(() => {
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      router.push('/login');
      return;
    }

    fetchServices();
  }, [session, router, fetchServices]);

  const handleToggleActive = async (serviceId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleToggleFeatured = async (serviceId: number, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: !isFeatured }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Servicios</h1>
            <p className="text-gray-600">Administra los servicios del centro infantil</p>
          </div>
          <button
            onClick={() => router.push('/admin/servicios/nuevo')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar servicios
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={showOnlyActive.toString()}
              onChange={(e) => setShowOnlyActive(e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="true">Solo activos</option>
              <option value="false">Todos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchServices}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Servicios ({filteredServices.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando servicios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {service.primary_image ? (
                            <div className="relative h-12 w-12">
                              <NextImage
                                className="rounded-lg object-cover"
                                src={service.primary_image}
                                alt={service.name}
                                fill
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <ImageIc className="h-6 w-6 text-gray-400"/>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.short_description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.price ? formatPrice(service.price) : 'Consultar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.age_range_min && service.age_range_max 
                        ? `${formatAge(service.age_range_min)} - ${formatAge(service.age_range_max)}`
                        : 'Todas'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        {service.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Destacado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/servicios/${service.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/servicios/${service.id}/editar`)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(service.id, service.is_active)}
                          className={`p-1 ${
                            service.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={service.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {service.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(service.id, service.is_featured)}
                          className={`p-1 ${
                            service.is_featured 
                              ? 'text-yellow-600 hover:text-yellow-900' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title={service.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        >
                          {service.is_featured ? '⭐' : '☆'}
                        </button>
                        {session?.user.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredServices.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-500 text-lg">No se encontraron servicios</div>
                <p className="text-gray-400 mt-2">
                  Intenta ajustar los filtros o crear un nuevo servicio.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}