'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, Edit, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  created_at: string;
  email_verified: boolean;
}

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);

  const [userInfo, setUserInfo] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    created_at: '',
    email_verified: false
  });

  const [originalUserInfo, setOriginalUserInfo] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    created_at: '',
    email_verified: false
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        const profileData = {
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          created_at: userData.created_at || '',
          email_verified: userData.email_verified || false
        };
        setUserInfo(profileData);
        setOriginalUserInfo(profileData);
      } else {
        // Si falla la API, usar datos de la sesión
        const sessionData = {
          firstName: session?.user?.name?.split(' ')[0] || '',
          lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
          email: session?.user?.email || '',
          phone: '',
          created_at: new Date().toISOString(),
          email_verified: true
        };
        setUserInfo(sessionData);
        setOriginalUserInfo(sessionData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Usar datos de la sesión como fallback
      const sessionData = {
        firstName: session?.user?.name?.split(' ')[0] || '',
        lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
        email: session?.user?.email || '',
        phone: '',
        created_at: new Date().toISOString(),
        email_verified: true
      };
      setUserInfo(sessionData);
      setOriginalUserInfo(sessionData);
    } finally {
      setFetchLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
  }, [session, status, router, fetchUserProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          phone: userInfo.phone
        })
      });

      if (response.ok) {
        setSuccess('Perfil actualizado exitosamente');
        setOriginalUserInfo({ ...userInfo });
        setEditing(false);

        // Actualizar la sesión si es necesario
        if (window.location) {
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar el perfil');
      }
    } catch {
      setError('Error de conexión al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUserInfo({ ...originalUserInfo });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (status === 'loading' || fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Personal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Información Personal</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={userInfo.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Tu nombre"
                        required
                      />
                    ) : (
                      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900">{userInfo.firstName || 'No especificado'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={userInfo.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Tu apellido"
                        required
                      />
                    ) : (
                      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900">{userInfo.lastName || 'No especificado'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">{userInfo.email || 'No especificado'}</span>
                    <span className="ml-2 text-xs text-gray-500">(No editable)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={userInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  ) : (
                    <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{userInfo.phone || 'No especificado'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Cuenta */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Información de la Cuenta</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo de Usuario</p>
                  <p className="text-gray-900 capitalize">{session?.user?.role || 'Padre/Madre'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Estado de Email</p>
                  <div className="flex items-center mt-1">
                    <div className={`h-2 w-2 rounded-full mr-2 ${userInfo.email_verified ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span className={`text-sm ${userInfo.email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {userInfo.email_verified ? 'Verificado' : 'Pendiente de verificación'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Miembro desde</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-900 text-sm">
                      {userInfo.created_at ?
                        new Date(userInfo.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) :
                        'Fecha no disponible'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones de Cuenta</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    Cambiar Contraseña
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    Configuración de Notificaciones
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Necesitas Ayuda?</h3>
          <p className="text-blue-800 text-sm mb-4">
            Si tienes problemas para actualizar tu perfil o necesitas cambiar información sensible,
            no dudes en contactar a nuestro equipo de soporte.
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <a
              href="mailto:centrodulmar@gmail.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              centrodulmar@gmail.com
            </a>
            <a
              href="tel:+573001234567"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              +57 300 123 4567
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}