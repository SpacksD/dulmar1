'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Menu, X, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2" style={{ borderBottomColor: '#00B4E5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center cursor-pointer">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-2xl mr-2">🏰</div>
              <div>
                <span className="text-xl font-bold text-gray-800">
                  DULMAR
                </span>
                <div className="text-xs text-gray-500">Centro Infantil</div>
              </div>
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href="/servicios"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Servicios
              </Link>
              <Link 
                href="/contacto"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Contacto
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse flex space-x-2">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Hola, {session.user.name?.split(' ')[0]}
                </span>

                {/* Dashboard para Padres */}
                {(session.user.role === 'parent' || !session.user.role || session.user.role === 'user') && (
                  <Link
                    href="/dashboard"
                    className="text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all shadow-lg hover:shadow-xl hover:bg-blue-700"
                    style={{ backgroundColor: '#00B4E5' }}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Mi Dashboard
                  </Link>
                )}

                {/* Panel Admin */}
                {(session.user.role === 'admin' || session.user.role === 'staff') && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/register"
                  className="text-white border-2 px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg hover:shadow-xl hover:bg-blue-600"
                  style={{ 
                    borderColor: '#00B4E5',
                    color: '#00B4E5'
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Registrarse
                </Link>
                <Link
                  href="/login"
                  className="text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center transition-all shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#00B4E5' }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link 
                href="/"
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link 
                href="/servicios"
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Servicios
              </Link>
              <Link 
                href="/contacto"
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </Link>

              {/* Mobile Auth */}
              {session ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.user.email}
                    </p>
                  </div>

                  {/* Dashboard para Padres - Mobile */}
                  {(session.user.role === 'parent' || !session.user.role || session.user.role === 'user') && (
                    <Link
                      href="/dashboard"
                      className="w-full text-left px-3 py-2 text-base font-medium text-white rounded-lg mx-3 mb-2 flex items-center"
                      style={{ backgroundColor: '#00B4E5' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Mi Dashboard
                    </Link>
                  )}

                  {/* Panel Admin - Mobile */}
                  {(session.user.role === 'admin' || session.user.role === 'staff') && (
                    <Link
                      href="/admin"
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Panel de Administración
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-900"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="pt-4 space-y-2">
                  <Link 
                    href="/register"
                    className="w-full mt-2 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center border-2"
                    style={{ 
                      borderColor: '#00B4E5',
                      color: '#00B4E5'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Registrarse
                  </Link>
                  <Link 
                    href="/login"
                    className="w-full mt-2 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center"
                    style={{ backgroundColor: '#00B4E5' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;