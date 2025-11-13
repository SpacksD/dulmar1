'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Search, Gift, Calendar, Tag, Users } from 'lucide-react';
import ServiceImage from '@/app/components/ServiceImage';
import { formatDateForDisplay } from '@/lib/utils';

function createDateFromString(dateString: string): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

interface Promotion {
  id: number;
  title: string;
  short_description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  promo_code: string;
  start_date: string;
  end_date: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  is_featured: boolean;
  primary_image: string;
  applicable_services: number[];
}

export default function PromocionesAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const fetchPromotions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        active: 'false' // Get all promotions, not just active ones
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter === 'featured') params.append('featured', 'true');

      const response = await fetch(`/api/promotions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        let filteredPromotions = data.promotions;
        
        // Apply status filter
        if (statusFilter === 'active') {
          filteredPromotions = filteredPromotions.filter((p: Promotion) => p.is_active);
        } else if (statusFilter === 'inactive') {
          filteredPromotions = filteredPromotions.filter((p: Promotion) => !p.is_active);
        }
        
        setPromotions(filteredPromotions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchPromotions();
  }, [session, router, fetchPromotions]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta promoción?')) return;

    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPromotions();
      } else {
        alert('Error al eliminar la promoción');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Error al eliminar la promoción');
    }
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}% OFF`;
    } else if (promotion.discount_type === 'fixed_amount') {
      return `$${promotion.discount_value} OFF`;
    } else {
      return 'SERVICIO GRATIS';
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const startDate = createDateFromString(promotion.start_date);
    const endDate = createDateFromString(promotion.end_date);
    endDate.setHours(23, 59, 59, 999); // Set to end of day to include the entire end date
    
    if (!promotion.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactiva</span>;
    }
    
    if (now < startDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Programada</span>;
    }
    
    if (now > endDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Expirada</span>;
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activa</span>;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Promociones</h1>
            <p className="text-gray-600">Administra promociones y ofertas especiales</p>
          </div>
          <button
            onClick={() => router.push('/admin/promociones/nueva')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Promoción
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar promociones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="featured">Destacadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-lg shadow-sm">
        {promotions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron promociones con los filtros aplicados.' 
                : 'Comienza creando tu primera promoción.'}
            </p>
            <button
              onClick={() => router.push('/admin/promociones/nueva')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Primera Promoción
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promoción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promotion) => (
                    <tr key={promotion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <ServiceImage
                              src={promotion.primary_image}
                              alt={promotion.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">
                                {promotion.title}
                              </div>
                              {promotion.is_featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Destacada
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {promotion.short_description}
                            </div>
                            {promotion.promo_code && (
                              <div className="flex items-center gap-1 mt-1">
                                <Tag className="h-3 w-3 text-gray-400" />
                                <span className="text-xs font-mono text-gray-600">
                                  {promotion.promo_code}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-600">
                          {getDiscountDisplay(promotion)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDateForDisplay(promotion.start_date)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            hasta {formatDateForDisplay(promotion.end_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(promotion)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>
                              {promotion.used_count || 0}
                              {promotion.max_uses && ` / ${promotion.max_uses}`}
                            </span>
                          </div>
                          {promotion.max_uses && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, ((promotion.used_count || 0) / promotion.max_uses) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => router.push(`/admin/promociones/${promotion.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/promociones/${promotion.id}/editar`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promotion.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}