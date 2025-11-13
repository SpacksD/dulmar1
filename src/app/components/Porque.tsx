import React from 'react';
import { Shield, BookOpen, Heart, Users, Award, Clock, LucideIcon } from 'lucide-react';

// Definir tipo para beneficio
interface Beneficio {
  id: number;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  color: string;
  bgColor: string;
}

const WhyChooseDulmar: React.FC = () => {
  const beneficios: Beneficio[] = [
    {
      id: 1,
      titulo: "Seguridad Total",
      descripcion: "Instalaciones seguras con protocolos de bioseguridad y cámaras de monitoreo las 24 horas",
      icono: Shield,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100"
    },
    {
      id: 2,
      titulo: "Educación Integral",
      descripcion: "Metodología personalizada basada en el desarrollo de múltiples inteligencias y valores",
      icono: BookOpen,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100"
    },
    {
      id: 3,
      titulo: "Cuidado Amoroso",
      descripcion: "Personal especializado que brinda cariño y atención personalizada a cada niño",
      icono: Heart,
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100"
    },
    {
      id: 4,
      titulo: "Grupos Pequeños",
      descripcion: "Máximo 12 niños por aula para garantizar atención individualizada y calidad educativa",
      icono: Users,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100"
    },
    {
      id: 5,
      titulo: "Experiencia Comprobada",
      descripcion: "Más de 5 años de experiencia cuidando y educando con amor a los pequeños",
      icono: Award,
      color: "from-amber-500 to-amber-600",
      bgColor: "from-amber-50 to-amber-100"
    },
    {
      id: 6,
      titulo: "Horarios Flexibles",
      descripcion: "Adaptamos nuestros horarios a las necesidades de las familias trabajadoras",
      icono: Clock,
      color: "from-teal-500 to-teal-600",
      bgColor: "from-teal-50 to-teal-100"
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ¿Por qué elegir DULMAR?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Somos más que un centro infantil, somos una segunda familia para tu pequeño donde cada día es una nueva oportunidad de aprender y crecer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beneficios.map((beneficio: Beneficio) => {
            const IconComponent = beneficio.icono;
            return (
              <div 
                key={beneficio.id} 
                className={`p-8 bg-gradient-to-br ${beneficio.bgColor} rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${beneficio.color} rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  {beneficio.titulo}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {beneficio.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseDulmar;

// Exportar también el tipo para usar en otros componentes
export type { Beneficio };