'use client';

import { useState, useEffect } from 'react';
import { Search, Users, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Child {
  id: number;
  subscription_id: number;
  photo_url: string | null;
  birth_date: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  allergies: Array<{ allergen: string; severity: string }>;
  medical_conditions: Array<{ condition: string }>;
  has_alerts: boolean;
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChildren(children);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = children.filter(
        (child) =>
          child.child_name.toLowerCase().includes(query) ||
          child.parent_name.toLowerCase().includes(query) ||
          child.parent_email.toLowerCase().includes(query)
      );
      setFilteredChildren(filtered);
    }
  }, [searchQuery, children]);

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/staff/children');
      const data = await res.json();
      if (data.success) {
        setChildren(data.data);
        setFilteredChildren(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Perfiles de Niños</h1>
        <p className="text-gray-600 mt-1">Información médica y observaciones</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de niño, padre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Niños</p>
          <p className="text-2xl font-bold text-gray-900">{children.length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-200">
          <p className="text-sm text-orange-700">Con Alertas Médicas</p>
          <p className="text-2xl font-bold text-orange-600">
            {children.filter(c => c.allergies.length > 0 || c.medical_conditions.length > 0).length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <p className="text-sm text-blue-700">Resultados</p>
          <p className="text-2xl font-bold text-blue-600">{filteredChildren.length}</p>
        </div>
      </div>

      {/* Children Grid */}
      {filteredChildren.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => (
            <Link
              key={child.id}
              href={`/staff/children/${child.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4">
                {/* Photo and Name */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {child.photo_url ? (
                      <Image
                        src={child.photo_url}
                        alt={child.child_name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {child.child_name}
                    </h3>
                    <p className="text-sm text-gray-600">{child.child_age} años</p>
                    <p className="text-xs text-gray-500 truncate">{child.parent_name}</p>
                  </div>
                </div>

                {/* Medical Alerts */}
                {(child.allergies.length > 0 || child.medical_conditions.length > 0) && (
                  <div className="mb-3">
                    <div className="flex items-center text-orange-600 mb-2">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Alertas Médicas</span>
                    </div>
                    <div className="space-y-1">
                      {child.allergies.slice(0, 2).map((allergy, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(allergy.severity)}`}>
                            {allergy.allergen}
                          </span>
                        </div>
                      ))}
                      {child.medical_conditions.slice(0, 1).map((condition, idx) => (
                        <div key={idx} className="text-xs text-gray-700">
                          • {condition.condition}
                        </div>
                      ))}
                      {(child.allergies.length + child.medical_conditions.length > 3) && (
                        <p className="text-xs text-gray-500">
                          +{child.allergies.length + child.medical_conditions.length - 3} más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <p className="truncate">📧 {child.parent_email}</p>
                  <p>📞 {child.parent_phone}</p>
                </div>

                {/* View Profile Button */}
                <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver perfil completo
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No se encontraron niños</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}
    </div>
  );
}
