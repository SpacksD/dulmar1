'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, AlertCircle, Heart, MessageSquare, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Allergen {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

interface MedicalCondition {
  condition: string;
  treatment?: string;
  notes?: string;
}

interface Medication {
  medication: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  is_primary: boolean;
  notes?: string;
}

interface ChildProfile {
  id: number;
  subscription_id: number;
  photo_url: string | null;
  birth_date: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  allergies: Allergen[];
  medical_conditions: MedicalCondition[];
  medications: Medication[];
  special_needs: string | null;
  emergency_contacts: EmergencyContact[];
  dietary_restrictions: string | null;
  favorite_activities: string | null;
  behavioral_notes: string | null;
}

interface Observation {
  id: number;
  observation_date: string;
  category: string;
  observation_text: string;
  is_important: boolean;
  staff_name: string;
  created_at: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ChildProfilePage({ params }: Props) {
  const resolvedParams = use(params);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newObservation, setNewObservation] = useState({
    observation_date: new Date().toISOString().split('T')[0],
    category: 'general',
    observation_text: '',
    is_important: false,
    share_with_parent: false,
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/staff/children/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await fetch(`/api/staff/children/${resolvedParams.id}/observations`);
      const data = await res.json();
      if (data.success) {
        setObservations(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitObservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newObservation.observation_text.length < 10) {
      alert('La observación debe tener al menos 10 caracteres');
      return;
    }

    try {
      const res = await fetch(`/api/staff/children/${resolvedParams.id}/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObservation),
      });

      if (res.ok) {
        setNewObservation({
          observation_date: new Date().toISOString().split('T')[0],
          category: 'general',
          observation_text: '',
          is_important: false,
          share_with_parent: false,
        });
        setShowObservationForm(false);
        fetchObservations();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'physical': return 'bg-blue-100 text-blue-800';
      case 'cognitive': return 'bg-purple-100 text-purple-800';
      case 'social': return 'bg-green-100 text-green-800';
      case 'emotional': return 'bg-pink-100 text-pink-800';
      case 'language': return 'bg-indigo-100 text-indigo-800';
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

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Perfil no encontrado</p>
        <Link href="/staff/children" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Volver a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/children"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a lista
        </Link>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {profile.photo_url ? (
              <Image
                src={profile.photo_url}
                alt={profile.child_name}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.child_name}</h1>
            <p className="text-gray-600">{profile.child_age} años • Fecha de nacimiento: {new Date(profile.birth_date).toLocaleDateString('es-ES')}</p>
            <p className="text-sm text-gray-500 mt-1">Padre/Madre: {profile.parent_name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Medical Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Allergies */}
          {profile.allergies.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center text-orange-600 mb-3">
                <AlertCircle className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Alergias</h2>
              </div>
              <div className="space-y-2">
                {profile.allergies.map((allergy, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(allergy.severity)}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{allergy.allergen}</span>
                      <span className="text-xs uppercase">{allergy.severity}</span>
                    </div>
                    {allergy.notes && <p className="text-sm mt-1">{allergy.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Conditions */}
          {profile.medical_conditions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center text-red-600 mb-3">
                <Heart className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Condiciones Médicas</h2>
              </div>
              <div className="space-y-3">
                {profile.medical_conditions.map((condition, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-gray-900">{condition.condition}</p>
                    {condition.treatment && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Tratamiento:</span> {condition.treatment}
                      </p>
                    )}
                    {condition.notes && <p className="text-sm text-gray-600 mt-1">{condition.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {profile.medications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Medicamentos</h2>
              <div className="space-y-3">
                {profile.medications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-900">{med.medication}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Dosis:</span> {med.dosage} • <span className="font-medium">Frecuencia:</span> {med.frequency}
                    </p>
                    {med.notes && <p className="text-sm text-gray-600 mt-1">{med.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Información Adicional</h2>
            <div className="space-y-3 text-sm">
              {profile.dietary_restrictions && (
                <div>
                  <span className="font-medium text-gray-700">Restricciones Dietéticas:</span>
                  <p className="text-gray-600 mt-1">{profile.dietary_restrictions}</p>
                </div>
              )}
              {profile.favorite_activities && (
                <div>
                  <span className="font-medium text-gray-700">Actividades Favoritas:</span>
                  <p className="text-gray-600 mt-1">{profile.favorite_activities}</p>
                </div>
              )}
              {profile.behavioral_notes && (
                <div>
                  <span className="font-medium text-gray-700">Notas de Comportamiento:</span>
                  <p className="text-gray-600 mt-1">{profile.behavioral_notes}</p>
                </div>
              )}
              {profile.special_needs && (
                <div>
                  <span className="font-medium text-gray-700">Necesidades Especiales:</span>
                  <p className="text-gray-600 mt-1">{profile.special_needs}</p>
                </div>
              )}
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-gray-900">
                <MessageSquare className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Observaciones</h2>
              </div>
              <button
                onClick={() => setShowObservationForm(!showObservationForm)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </button>
            </div>

            {/* New Observation Form */}
            {showObservationForm && (
              <form onSubmit={handleSubmitObservation} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={newObservation.observation_date}
                        onChange={(e) => setNewObservation({ ...newObservation, observation_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={newObservation.category}
                        onChange={(e) => setNewObservation({ ...newObservation, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="general">General</option>
                        <option value="physical">Físico</option>
                        <option value="cognitive">Cognitivo</option>
                        <option value="social">Social</option>
                        <option value="emotional">Emocional</option>
                        <option value="language">Lenguaje</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                    <textarea
                      value={newObservation.observation_text}
                      onChange={(e) => setNewObservation({ ...newObservation, observation_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Describe tu observación..."
                      required
                      minLength={10}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newObservation.is_important}
                        onChange={(e) => setNewObservation({ ...newObservation, is_important: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Importante</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newObservation.share_with_parent}
                        onChange={(e) => setNewObservation({ ...newObservation, share_with_parent: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Compartir con padre</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowObservationForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Observations List */}
            {observations.length > 0 ? (
              <div className="space-y-3">
                {observations.map((obs) => (
                  <div key={obs.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(obs.category)}`}>
                          {obs.category}
                        </span>
                        {obs.is_important && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Importante
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(obs.observation_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{obs.observation_text}</p>
                    <p className="text-xs text-gray-500">Por {obs.staff_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay observaciones registradas</p>
            )}
          </div>
        </div>

        {/* Right Column - Contact Information */}
        <div className="space-y-6">
          {/* Parent Contact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contacto del Padre</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{profile.parent_name}</p>
              <p className="text-gray-600">📧 {profile.parent_email}</p>
              <p className="text-gray-600">📞 {profile.parent_phone}</p>
            </div>
          </div>

          {/* Emergency Contacts */}
          {profile.emergency_contacts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Contactos de Emergencia</h2>
              <div className="space-y-3">
                {profile.emergency_contacts.map((contact, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${contact.is_primary ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{contact.relation}</p>
                    <p className="text-sm text-gray-700 mt-1">📞 {contact.phone}</p>
                    {contact.notes && <p className="text-xs text-gray-500 mt-1">{contact.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
