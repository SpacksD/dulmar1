'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Users,
  Star,
  Gift,
  Calendar,
  Home,
  LogOut,
  Menu,
  X,
  CreditCard,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !['admin', 'staff', 'parent'].includes(session.user.role)) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'staff', 'parent'].includes(session.user.role)) {
    return null;
  }

  const isAdmin = session.user.role === 'admin';
  const isStaff = session.user.role === 'staff';

  interface MenuItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    separator?: boolean;
  }

  const adminMenuItems: MenuItem[] = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/servicios', icon: Settings, label: 'Servicios' },
    { href: '/admin/promociones', icon: Gift, label: 'Promociones' },
    { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
    { href: '/admin/pagos', icon: CreditCard, label: 'Pagos' },
    { href: '/admin/facturacion-mensual', icon: FileText, label: 'Facturación Mensual' },
    { href: '/admin/horarios', icon: Clock, label: 'Horarios' },
    { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { href: '/staff/attendance', icon: UserCheck, label: 'Gestión de Staff', separator: true },
  ];

  const staffMenuItems: MenuItem[] = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/servicios', icon: Settings, label: 'Servicios' },
    { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
    { href: '/admin/pagos', icon: CreditCard, label: 'Pagos' },
  ];

  const parentMenuItems: MenuItem[] = [
    { href: '/admin/mis-servicios', icon: Star, label: 'Mis Servicios' },
    { href: '/admin/mis-reservas', icon: Calendar, label: 'Mis Reservas' },
  ];

  const menuItems = isAdmin ? adminMenuItems : isStaff ? staffMenuItems : parentMenuItems;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-2">🏰</div>
            <div>
              <span className="text-lg font-bold text-gray-800">DULMAR</span>
              <div className="text-xs text-gray-500">Panel Admin</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session.user.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <div key={item.href}>
                  {item.separator && (
                    <div className="pt-4 pb-2">
                      <div className="border-t border-gray-200"></div>
                    </div>
                  )}
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="mr-3 h-5 w-5" />
              Ver Sitio Web
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="text-lg mr-2">🏰</div>
              <span className="text-lg font-bold text-gray-800">DULMAR Admin</span>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}