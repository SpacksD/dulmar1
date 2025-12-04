'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  Settings,
  Gift,
  Calendar,
  Eye,
  DollarSign,
  TrendingUp,
  Activity,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface AnalyticsData {
  users: {
    total: number;
    lastMonth: number;
    byMonth: { month: string; count: number }[];
  };
  bookings: {
    total: number;
    lastMonth: number;
    byMonth: { month: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  payments: {
    total: { count: number; amount: number };
    lastMonth: { count: number; amount: number };
    byMonth: { month: string; count: number; total_amount: number }[];
    byStatus: { status: string; count: number; total_amount: number }[];
  };
  subscriptions: {
    active: number;
  };
  services: {
    total: number;
    popular: { name: string; subscription_count: number }[];
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSessions, setGeneratingSessions] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchAnalytics();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSessions = async () => {
    if (!confirm('¿Estás seguro de que quieres generar sesiones para todas las subscripciones activas? Esto creará sesiones para los próximos 3 meses.')) {
      return;
    }

    setGeneratingSessions(true);
    setGenerateMessage(null);

    try {
      const response = await fetch('/api/admin/sessions/generate-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setGenerateMessage({
          type: 'success',
          text: `✅ ${data.message}\n${data.data.subscriptions_processed} subscripciones procesadas, ${data.data.total_sessions_created} sesiones creadas.`
        });
        // Refresh analytics after generating sessions
        fetchAnalytics();
      } else {
        setGenerateMessage({
          type: 'error',
          text: `❌ Error: ${data.error}`
        });
      }
    } catch (error) {
      console.error('Error generating sessions:', error);
      setGenerateMessage({
        type: 'error',
        text: '❌ Error al generar sesiones. Por favor, intenta de nuevo.'
      });
    } finally {
      setGeneratingSessions(false);
      // Clear message after 5 seconds
      setTimeout(() => setGenerateMessage(null), 5000);
    }
  };

  if (!session) return null;

  const isAdmin = session.user.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso no autorizado
          </h2>
          <p className="text-gray-600">
            Solo los administradores pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  };

  // Prepare chart data
  const getUsersChartData = () => {
    if (!analytics) return null;

    const labels = analytics.users.byMonth.map(d => formatMonth(d.month));
    return {
      labels,
      datasets: [
        {
          label: 'Nuevos Usuarios',
          data: analytics.users.byMonth.map(d => d.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const getBookingsChartData = () => {
    if (!analytics) return null;

    const labels = analytics.bookings.byMonth.map(d => formatMonth(d.month));
    return {
      labels,
      datasets: [
        {
          label: 'Reservas',
          data: analytics.bookings.byMonth.map(d => d.count),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1
        }
      ]
    };
  };

  const getPaymentsChartData = () => {
    if (!analytics) return null;

    const labels = analytics.payments.byMonth.map(d => formatMonth(d.month));
    return {
      labels,
      datasets: [
        {
          label: 'Ingresos (S/.)',
          data: analytics.payments.byMonth.map(d => d.total_amount),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const getBookingsStatusData = () => {
    if (!analytics) return null;

    const statusLabels: { [key: string]: string } = {
      pending: 'Pendientes',
      confirmed: 'Confirmadas',
      completed: 'Completadas',
      cancelled: 'Canceladas',
      no_show: 'No asistió'
    };

    return {
      labels: analytics.bookings.byStatus.map(d => statusLabels[d.status] || d.status),
      datasets: [
        {
          data: analytics.bookings.byStatus.map(d => d.count),
          backgroundColor: [
            'rgba(251, 191, 36, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {getGreeting()}, {session.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Panel de Analytics y Estadísticas
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : analytics ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.users.total}</h3>
              <p className="text-sm text-gray-600 mb-2">Usuarios Registrados</p>
              <div className="flex items-center text-sm">
                {analytics.users.lastMonth > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{analytics.users.lastMonth} último mes
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Sin nuevos usuarios</span>
                )}
              </div>
            </div>

            {/* Bookings Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.bookings.total}</h3>
              <p className="text-sm text-gray-600 mb-2">Reservas Realizadas</p>
              <div className="flex items-center text-sm">
                {analytics.bookings.lastMonth > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{analytics.bookings.lastMonth} último mes
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Sin nuevas reservas</span>
                )}
              </div>
            </div>

            {/* Payments Count Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics.payments.total.count}</h3>
              <p className="text-sm text-gray-600 mb-2">Pagos Confirmados</p>
              <div className="flex items-center text-sm">
                {analytics.payments.lastMonth.count > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{analytics.payments.lastMonth.count} último mes
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Sin pagos nuevos</span>
                )}
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.payments.total.amount)}
              </h3>
              <p className="text-sm text-gray-600 mb-2">Ingresos Totales</p>
              <div className="flex items-center text-sm">
                {analytics.payments.lastMonth.amount > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(analytics.payments.lastMonth.amount)} último mes
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Sin ingresos nuevos</span>
                )}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Users Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Usuarios Registrados (Últimos 12 meses)
              </h3>
              <div className="h-64">
                {getUsersChartData() && (
                  <Line data={getUsersChartData()!} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Bookings Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Reservas Mensuales (Últimos 12 meses)
              </h3>
              <div className="h-64">
                {getBookingsChartData() && (
                  <Bar data={getBookingsChartData()!} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Payments Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Ingresos Mensuales (Últimos 12 meses)
              </h3>
              <div className="h-64">
                {getPaymentsChartData() && (
                  <Line data={getPaymentsChartData()!} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Bookings Status Doughnut */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                Distribución de Reservas por Estado
              </h3>
              <div className="h-64">
                {getBookingsStatusData() && (
                  <Doughnut data={getBookingsStatusData()!} options={doughnutOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas Adicionales</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-700">Servicios Activos</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{analytics.services.total}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Suscripciones Activas</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{analytics.subscriptions.active}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>

              {/* Generate Sessions Message */}
              {generateMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  generateMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="text-sm whitespace-pre-line">{generateMessage.text}</p>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href="/admin/servicios"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-800">Gestionar Servicios</span>
                </Link>

                <Link
                  href="/admin/reservas"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-800">Gestionar Reservas</span>
                </Link>

                <Link
                  href="/admin/promociones"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Gift className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-800">Gestionar Promociones</span>
                </Link>

                <Link
                  href="/admin/usuarios"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-800">Gestionar Usuarios</span>
                </Link>

                {/* Generate Sessions Button */}
                <button
                  onClick={handleGenerateSessions}
                  disabled={generatingSessions}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    generatingSessions
                      ? 'bg-gray-200 cursor-not-allowed'
                      : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <RefreshCw className={`h-5 w-5 text-blue-600 mr-3 ${generatingSessions ? 'animate-spin' : ''}`} />
                  <span className="text-blue-800 font-medium">
                    {generatingSessions ? 'Generando sesiones...' : 'Generar Sesiones (3 meses)'}
                  </span>
                </button>

                <a
                  href="/"
                  target="_blank"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-800">Ver Sitio Web</span>
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
        </div>
      )}
    </div>
  );
}
