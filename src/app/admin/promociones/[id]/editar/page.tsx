'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  category: string;
}

function formatDateForInput(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

function formatDateForDB(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString().split('T')[0];
}

export default function EditarPromocionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const promotionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_age: '',
    max_age: '',
    applicable_services: [] as number[],
    promo_code: '',
    start_date: '',
    end_date: '',
    max_uses: '',
    is_active: true,
    is_featured: false,
    terms_conditions: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [promotionRes, servicesRes] = await Promise.all([
        fetch(`/api/promotions/${promotionId}`),
        fetch('/api/services')
      ]);

      if (promotionRes.ok) {
        const promotionData = await promotionRes.json();
        const promo = promotionData.promotion;

        setFormData({
          title: promo.title || '',
          description: promo.description || '',
          short_description: promo.short_description || '',
          discount_type: promo.discount_type || 'percentage',
          discount_value: promo.discount_value?.toString() || '',
          min_age: promo.min_age?.toString() || '',
          max_age: promo.max_age?.toString() || '',
          applicable_services: promo.applicable_services || [],
          promo_code: promo.promo_code || '',
          start_date: formatDateForInput(promo.start_date),
          end_date: formatDateForInput(promo.end_date),
          max_uses: promo.max_uses?.toString() || '',
          is_active: promo.is_active || false,
          is_featured: promo.is_featured || false,
          terms_conditions: promo.terms_conditions || ''
        });
      } else {
        setError('Promoción no encontrada');
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

    } catch {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [promotionId]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }

    fetchData();
  }, [session, status, router, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        start_date: formatDateForDB(formData.start_date),
        end_date: formatDateForDB(formData.end_date),
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      };

      const response = await fetch(`/api/promotions/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        router.push('/admin/promociones');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar promoción');
      }
    } catch {
      setError('Error interno del servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      applicable_services: prev.applicable_services.includes(serviceId)
        ? prev.applicable_services.filter(id => id !== serviceId)
        : [...prev.applicable_services, serviceId]
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/promociones"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a promociones
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Promoción</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Código Promocional
                </label>
                <input
                  type="text"
                  value={formData.promo_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, promo_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Descripción Corta
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Descripción Completa
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tipo de Descuento *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Valor del Descuento
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Edad Mínima (meses)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Edad Máxima (meses)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Límite de Usos
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Servicios Aplicables
              </label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={formData.applicable_services.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`service-${service.id}`} className="text-sm font-medium text-gray-900">
                      {service.name} ({service.category})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Términos y Condiciones
              </label>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-900">Promoción Activa</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-900">Promoción Destacada</label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/admin/promociones">
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50">
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Promoción
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}