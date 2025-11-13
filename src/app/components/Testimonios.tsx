import React from 'react';
import { Star } from 'lucide-react';

// Definir tipo para testimonio
interface Testimonio {
  id: number;
  nombre: string;
  relacion: string;
  comentario: string;
  rating: number;
  inicial: string;
  color: string;
}

const TestimonialsSection: React.FC = () => {
  const testimonios: Testimonio[] = [
    {
      id: 1,
      nombre: "María González",
      relacion: "Mamá de Sofía (4 años)",
      comentario: "Mi hija ama ir a DULMAR. Las maestras son increíbles y el ambiente es muy acogedor. Sofía ha desarrollado mucho su creatividad y socialización.",
      rating: 5,
      inicial: "M",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      nombre: "Carlos Mendoza",
      relacion: "Papá de Mateo (2 años)",
      comentario: "La estimulación temprana que recibe Mateo ha sido fundamental para su desarrollo. El equipo de DULMAR es muy profesional y cariñoso.",
      rating: 5,
      inicial: "C",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      nombre: "Lucía Pérez",
      relacion: "Mamá de Diego (5 años)",
      comentario: "Diego está súper preparado para el colegio gracias a DULMAR. Los valores que le enseñan y el ambiente familiar nos encantan.",
      rating: 5,
      inicial: "L",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Lo que dicen nuestras familias
          </h2>
          <p className="text-xl text-gray-600">
            Testimonios reales de padres satisfechos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonios.map((testimonio: Testimonio) => (
            <div key={testimonio.id} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="flex items-center mb-6">
                <div className={`w-14 h-14 bg-gradient-to-r ${testimonio.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {testimonio.inicial}
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900 text-lg">{testimonio.nombre}</h4>
                  <p className="text-sm text-gray-500">{testimonio.relacion}</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-base mb-6 leading-relaxed italic">
                `&quot;`{testimonio.comentario}`&quot;`
              </p>
              
              <div className="flex items-center">
                <div className="flex text-amber-400 mr-2">
                  {[...Array(testimonio.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  {testimonio.rating}.0 estrellas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

// Exportar también el tipo para usar en otros componentes
export type { Testimonio };