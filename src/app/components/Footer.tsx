import React from 'react';
import { Phone, Mail, Clock, MapPin, Heart, User } from 'lucide-react';

// Definir tipos para las props
interface Parametros {
  nombreEmpresa: string;
  slogan: string;
  telefono: string;
  email: string;
  horario: string;
  direccion: string;
  whatsapp: string;
  directora: string;
}

interface FooterProps {
  parametros: Parametros;
  onPageChange: (page: string) => void;
  handleWhatsAppContact: () => void;
}

const Footer: React.FC<FooterProps> = ({ parametros, onPageChange, handleWhatsAppContact }) => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información principal */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-3">🏰</div>
              <div>
                <span className="text-2xl font-bold text-white">
                  Centro Infantil DULMAR
                </span>
                <div className="text-sm text-gray-400 mt-1">
                  {parametros.slogan}
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Brindamos amor, seguridad y educación de calidad para el desarrollo integral de tu pequeño. 
              Más de 5 años cuidando y educando con cariño a las futuras generaciones.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-400">
                <User className="h-4 w-4 mr-2 text-blue-400" />
                <span className="font-semibold">Directora:</span>
                <span className="ml-2">{parametros.directora}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                <span>{parametros.direccion}</span>
              </div>
            </div>
          </div>
          
          {/* Enlaces de navegación */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-blue-300">Navegación</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onPageChange('inicio')}
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  Inicio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange('servicios')}
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  Servicios
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange('contacto')}
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  Contacto
                </button>
              </li>
            </ul>

            {/* Enlaces legales */}
            <h4 className="text-md font-semibold mt-8 mb-4 text-gray-300">Información Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Libro de Reclamaciones
                </a>
              </li>
            </ul>
          </div>
          
          {/* Información de contacto */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-blue-300">Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">{parametros.telefono}</div>
                  <div className="text-gray-400 text-sm">Llamadas y mensajes</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">{parametros.email}</div>
                  <div className="text-gray-400 text-sm">Respuesta en 24 horas</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Lun - Vie</div>
                  <div className="text-gray-400 text-sm">7:00 AM - 6:00 PM</div>
                  <div className="text-white font-medium">Sábados</div>
                  <div className="text-gray-400 text-sm">8:00 AM - 2:00 PM</div>
                </div>
              </div>
            </div>
            
            {/* Botón de WhatsApp */}
            <button 
              onClick={handleWhatsAppContact}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Phone className="h-5 w-5 mr-2" />
              Contactar por WhatsApp
            </button>
          </div>
        </div>
        
        {/* Línea divisoria y copyright */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-center md:text-left">
              <p className="flex items-center justify-center md:justify-start">
                © 2025 Centro Infantil DULMAR. Todos los derechos reservados.
                <Heart className="h-4 w-4 text-red-400 mx-2" />
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 text-sm text-center">
                Brindamos seguridad, aprendizaje y salud infantil 🌈
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;