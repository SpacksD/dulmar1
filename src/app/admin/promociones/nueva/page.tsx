'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X,  Percent, DollarSign } from 'lucide-react';


interface PromotionFormData {
  title: string;
  description: string;
  short_description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number | null;
  min_age: number | null;
  max_age: number | null;
  applicable_services: number[];
  promo_code: string;
  start_date: string;
  end_date: string;
  max_uses: number | null;
  is_active: boolean;
  is_featured: boolean;
  terms_conditions: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
}

export default function NuevaPromocionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<PromotionFormData>({
    title: '',
    description: '',
    short_description: '',
    discount_type: 'percentage',
    discount_value: null,
    min_age: null,
    max_age: null,
    applicable_services: [],
    promo_code: '',
    start_date: '',
    end_date: '',
    max_uses: null,
    is_active: true,
    is_featured: false,
    terms_conditions: ''
  });

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }

    fetchServices();
  }, [session, router]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?limit=100&active=true');
      const data = await response.json();
      if (response.ok) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? (value === '' ? null : Number(value)) : value
    }));
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      applicable_services: prev.applicable_services.includes(serviceId)
        ? prev.applicable_services.filter(id => id !== serviceId)
        : [...prev.applicable_services, serviceId]
    }));
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

  const uploadImageForPromotion = async (promotionId: number): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      uploadFormData.append('entityType', 'promotion');
      uploadFormData.append('entityId', promotionId.toString());
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

  const generatePromoCode = () => {
    const code = 'DULMAR' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setFormData(prev => ({...prev, promo_code: code}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.discount_type || !formData.start_date || !formData.end_date) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      // Create promotion first
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const promotionId = data.promotion.id;
        
        // Upload and associate image if selected
        if (imageFile) {
          const imageUrl = await uploadImageForPromotion(promotionId);
          if (!imageUrl) {
            alert('Promoción creada pero la imagen no pudo subirse');
          }
        }
        
        alert('Promoción creada exitosamente');
        router.push('/admin/promociones');
      } else {
        throw new Error(data.error || 'Error creating promotion');
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('Error al crear la promoción');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Nueva Promoción</h1>
            <p className="text-gray-600">Crear una nueva promoción u oferta especial</p>
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
                  Título de la Promoción *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ej: 20% de descuento en servicios de verano"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Promocional
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="DULMAR2024"
                  />
                  <button
                    type="button"
                    onClick={generatePromoCode}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Generar
                  </button>
                </div>
              </div>
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
                placeholder="Descripción breve para mostrar en tarjetas"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.short_description.length}/150 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Completa
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Descripción detallada de la promoción..."
              />
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Configuración del Descuento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Descuento *
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed_amount">Cantidad Fija</option>
                  <option value="free_service">Servicio Gratuito</option>
                </select>
              </div>
              
              {formData.discount_type !== 'free_service' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor del Descuento *
                  </label>
                  <div className="relative">
                    {formData.discount_type === 'percentage' && (
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    )}
                    {formData.discount_type === 'fixed_amount' && (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    )}
                    <input
                      type="number"
                      name="discount_value"
                      value={formData.discount_value || ''}
                      onChange={handleInputChange}
                      required={true}
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder={formData.discount_type === 'percentage' ? '20' : '50.00'}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates and Limits */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Fechas y Límites
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usos Máximos
                </label>
                <input
                  type="number"
                  name="max_uses"
                  value={formData.max_uses || ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Ilimitado"
                />
              </div>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Rango de Edades (Opcional)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad Mínima (meses)
                </label>
                <input
                  type="number"
                  name="min_age"
                  value={formData.min_age || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Todas las edades"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad Máxima (meses)
                </label>
                <input
                  type="number"
                  name="max_age"
                  value={formData.max_age || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Todas las edades"
                />
              </div>
            </div>
          </div>

          {/* Applicable Services */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Servicios Aplicables
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => (
                <label key={service.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applicable_services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.category}</p>
                  </div>
                </label>
              ))}
            </div>
            {formData.applicable_services.length === 0 && (
              <p className="text-sm text-gray-500">Si no seleccionas servicios, la promoción aplicará a todos</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Imagen de la Promoción
            </h2>
            
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Selecciona una imagen para la promoción</p>
                  <p className="text-sm text-gray-500 mb-4">JPG, PNG o GIF. Máximo 5MB.</p>
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

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Términos y Condiciones
            </h2>
            
            <div>
              <textarea
                name="terms_conditions"
                value={formData.terms_conditions}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Términos y condiciones de la promoción..."
              />
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
                  Promoción activa
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
                  Promoción destacada (aparece en la página principal)
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
              disabled={loading || uploadingImage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : uploadingImage ? 'Subiendo imagen...' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}