'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Mail,
  PlayCircle,
  RefreshCw,
  Info
} from 'lucide-react';

interface SystemStatus {
  activeSubscriptions: number;
  currentMonth: number;
  currentYear: number;
  message: string;
}

interface GenerationResult {
  message: string;
  generatedCount: number;
  emailsSent: number;
  totalSubscriptions: number;
  errors?: string[];
  targetMonth: number;
  targetYear: number;
}

export default function FacturacionMensualPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchSystemStatus();
  }, [session, status, router]);

  const fetchSystemStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await fetch('/api/invoices/generate-monthly');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const generateMonthlyInvoices = async () => {
    try {
      setLoading(true);
      setGenerationResult(null);

      const response = await fetch('/api/invoices/generate-monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetMonth: selectedMonth,
          targetYear: selectedYear
        })
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Refresh system status
        await fetchSystemStatus();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating monthly invoices:', error);
      alert('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Facturación Mensual Automática</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona la generación automática de recibos mensuales para suscripciones activas
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Card */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Info className="h-6 w-6 mr-2 text-blue-600" />
                Estado del Sistema
              </h2>
              <button
                onClick={fetchSystemStatus}
                disabled={loadingStatus}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Suscripciones Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStatus.activeSubscriptions}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mes/Año Actual</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {months[systemStatus.currentMonth - 1]} {systemStatus.currentYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-sm font-medium text-green-600">{systemStatus.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Generation Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <PlayCircle className="h-6 w-6 mr-2 text-green-600" />
            Generación Manual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes a Facturar
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                disabled={loading}
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año a Facturar
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                disabled={loading}
              >
                <option value={selectedYear - 1}>{selectedYear - 1}</option>
                <option value={selectedYear}>{selectedYear}</option>
                <option value={selectedYear + 1}>{selectedYear + 1}</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">¿Cómo funciona la generación automática?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Se generan recibos para todas las suscripciones activas</li>
                  <li>Solo se crean recibos que no existan previamente para el mes seleccionado</li>
                  <li>Se envía automáticamente un email con el PDF del recibo adjunto</li>
                  <li>La fecha de vencimiento se establece 7 días después de la generación</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={generateMonthlyInvoices}
            disabled={loading || !systemStatus}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generando Recibos...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Generar Recibos para {months[selectedMonth - 1]} {selectedYear}
              </>
            )}
          </button>
        </div>

        {/* Results Card */}
        {generationResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Resultado de la Generación
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">{generationResult.message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{generationResult.generatedCount}</p>
                <p className="text-sm text-gray-600">Recibos Generados</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{generationResult.emailsSent}</p>
                <p className="text-sm text-blue-600">Emails Enviados</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-900">{generationResult.totalSubscriptions}</p>
                <p className="text-sm text-yellow-600">Suscripciones Revisadas</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-900">
                  {months[generationResult.targetMonth - 1]}
                </p>
                <p className="text-sm text-purple-600">{generationResult.targetYear}</p>
              </div>
            </div>

            {generationResult.errors && generationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-red-800">Errores Encontrados</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {generationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Manual Process Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Proceso Manual de Facturación</h3>
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                <strong>Control Total:</strong> La generación de recibos se realiza únicamente de forma manual
              </p>
              <p className="mb-2">
                <strong>Flexibilidad:</strong> Puedes generar recibos para cualquier mes y año según sea necesario
              </p>
              <p className="mb-2">
                <strong>Seguridad:</strong> Solo los administradores pueden ejecutar este proceso
              </p>
              <p>
                <strong>Recomendación:</strong> Ejecuta este proceso el primer día de cada mes para generar los recibos mensuales
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}