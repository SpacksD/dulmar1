'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import ServiceImage from '@/app/components/ServiceImage';

interface ServiceFormData {
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
  sessions_included: number;
  pricing_type: 'sessions' | 'fixed';
  is_active: boolean;
  is_featured: boolean;
}

export default function EditarServicioPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    age_range_min: null,
    age_range_max: null,
    duration: null,
    capacity: null,
    price: null,
    sessions_included: 8,
    pricing_type: 'sessions',
    is_active: true,
    is_featured: false
  });

  const fetchService = useCallback(async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      const data = await response.json();
      
      if (response.ok) {
        const service = data.service;
        setFormData({
          name: service.name || '',
          slug: service.slug || '',
          description: service.description || '',
          short_description: service.short_description || '',
          category: service.category || '',
          age_range_min: service.age_range_min,
          age_range_max: service.age_range_max,
          duration: service.duration,
          capacity: service.capacity,
          price: service.price,
          sessions_included: service.sessions_included || 8,
          pricing_type: service.pricing_type || 'sessions',
          is_active: service.is_active,
          is_featured: service.is_featured
        });
        setCurrentImage(service.primary_image);
      } else {
        alert('Error al cargar el servicio');
        router.push('/admin/servicios');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      alert('Error al cargar el servicio');
      router.push('/admin/servicios');
    } finally {
      setLoading(false);
    }
  }, [serviceId, router]);

  useEffect(() => {
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      router.push('/admin');
      return;
    }

    if (serviceId) {
      fetchService();
    }
  }, [session, router, serviceId, fetchService]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let processedValue;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      if (name === 'sessions_included') {
        // sessions_included nunca debe ser null, valor mínimo 1
        processedValue = value === '' ? 1 : Math.max(1, Number(value));
      } else {
        processedValue = value === '' ? null : Number(value);
      }
    } else {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImageForService = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      uploadFormData.append('entityType', 'service');
      uploadFormData.append('entityId', serviceId.toString());
      uploadFormData.append('isPrimary', 'true');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.url;
      } else {
        throw new Error(data.error || 'Error uploading image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.category) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      // Update service
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Upload new image if selected
        if (imageFile) {
          const imageUrl = await uploadImageForService();
          if (!imageUrl) {
            alert('Servicio actualizado pero la imagen no pudo subirse');
          }
        }
        
        alert('Servicio actualizado exitosamente');
        router.push('/admin/servicios');
      } else {
        throw new Error(data.error || 'Error updating service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Error al actualizar el servicio');
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Editar Servicio</h1>
            <p className="text-gray-600">Actualizar información del servicio</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: Cuidado Infantil Matutino"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Se genera automáticamente"
                />
                <p className="text-xs text-gray-500 mt-1">Se genera automáticamente desde el nombre</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Seleccionar categoría</option>
                <option value="Cuidado Diario">Cuidado Diario</option>
                <option value="Educación Temprana">Educación Temprana</option>
                <option value="Actividades Recreativas">Actividades Recreativas</option>
                <option value="Cuidado Especial">Cuidado Especial</option>
                <option value="Talleres">Talleres</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Corta *
              </label>
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Descripción breve del servicio (máximo 150 caracteres)"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.short_description.length}/150 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Completa *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Descripción detallada del servicio..."
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Detalles del Servicio
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad Mínima (meses)
                </label>
                <input
                  type="number"
                  name="age_range_min"
                  value={formData.age_range_min || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad Máxima (meses)
                </label>
                <input
                  type="number"
                  name="age_range_max"
                  value={formData.age_range_max || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 240"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad (niños)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (S/.)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Precio *
                </label>
                <select
                  name="pricing_type"
                  value={formData.pricing_type || 'sessions'}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="sessions">Por Sesiones</option>
                  <option value="fixed">Precio Fijo</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Por sesiones: precio variable según cantidad de sesiones
                  <br />Precio fijo: precio mensual fijo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sesiones Incluidas *
                </label>
                <input
                  type="number"
                  name="sessions_included"
                  value={formData.sessions_included || 8}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de sesiones {formData.pricing_type === 'fixed' ? 'incluidas en el precio fijo' : 'base (precio estándar)'}
                </p>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Imagen Principal
            </h2>
            
            {/* Current Image */}
            {currentImage && !imagePreview && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Imagen actual:</p>
                <ServiceImage
                  src={currentImage}
                  alt="Imagen actual del servicio"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {currentImage ? 'Selecciona una nueva imagen' : 'Selecciona una imagen para el servicio'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG o GIF. Máximo 5MB.
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Configuración
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Servicio activo (visible para los usuarios)
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Servicio destacado (aparece en la página principal)
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : uploadingImage ? 'Subiendo imagen...' : 'Actualizar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}