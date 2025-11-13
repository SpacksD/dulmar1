'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Home, Calendar, User, LogOut, Bell, CreditCard, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  // Permitir acceso a rutas de administración para admins
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  const isAdmin = session.user.role === 'admin' || session.user.role === 'staff';

  // Solo bloquear admins si NO están en una ruta de administración
  if (isAdmin && !isAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel de Administración</h1>
          <p className="text-gray-600 mb-6">
            Bienvenido, administrador. Selecciona el área que deseas gestionar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Link
              href="/dashboard/admin/horarios"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Clock className="h-5 w-5 mr-2" />
              Gestión de Horarios
            </Link>
            <Link
              href="/admin"
              className="flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              Panel Principal
            </Link>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-blue-600">DULMAR</h1>
                </div>
                <div className="hidden md:block ml-4">
                  <span className="text-gray-600 text-sm">Dashboard de Padres</span>
                </div>
              </Link>
            </div>

            {/* Quick Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Link>

              {/* Enlaces para padres */}
              {!isAdmin && (
                <>
                  <Link
                    href="/dashboard/mis-reservas"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mis Reservas
                  </Link>
                  <Link
                    href="/dashboard/pagos"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagos y Recibos
                  </Link>
                  <Link
                    href="/dashboard/perfil"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Link>
                </>
              )}

              {/* Enlaces para administradores */}
              {isAdmin && (
                <>
                  <Link
                    href="/dashboard/admin/horarios"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Gestión de Horarios
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Panel Admin
                  </Link>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications (placeholder for future implementation) */}
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Info & Logout */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (bottom on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className={`grid gap-1 ${isAdmin ? 'grid-cols-4' : 'grid-cols-5'}`}>
          <Link
            href="/dashboard"
            className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mb-1" />
            Inicio
          </Link>

          {/* Navegación para padres */}
          {!isAdmin && (
            <>
              <Link
                href="/dashboard/mis-reservas"
                className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5 mb-1" />
                Reservas
              </Link>
              <Link
                href="/dashboard/pagos"
                className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="h-5 w-5 mb-1" />
                Pagos
              </Link>
              <Link
                href="/dashboard/perfil"
                className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <User className="h-5 w-5 mb-1" />
                Perfil
              </Link>
            </>
          )}

          {/* Navegación para administradores */}
          {isAdmin && (
            <>
              <Link
                href="/dashboard/admin/horarios"
                className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-5 w-5 mb-1" />
                Horarios
              </Link>
              <Link
                href="/admin"
                className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <Shield className="h-5 w-5 mb-1" />
                Admin
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            className="flex flex-col items-center py-3 px-2 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-5 w-5 mb-1" />
            Salir
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}