'use client';

import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  opacity: number;
}

export default function ChristmasDecoration() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Generar MÁS copos de nieve
    const flakes: Snowflake[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 5 + Math.random() * 15,
      size: 3 + Math.random() * 8,
      opacity: 0.4 + Math.random() * 0.6,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      {/* Copos de nieve animados */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-fall"
            style={{
              left: `${flake.left}%`,
              animationDuration: `${flake.animationDuration}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: flake.opacity,
            }}
          >
            <div
              className="text-white drop-shadow-lg"
              style={{
                fontSize: `${flake.size}px`,
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
              }}
            >
              ❄
            </div>
          </div>
        ))}
      </div>

      {/* Luces navideñas en los bordes */}
      <div className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-40 flex justify-around items-start">
        {[...Array(30)].map((_, i) => (
          <div
            key={`top-${i}`}
            className="relative"
            style={{ marginTop: '5px' }}
          >
            <div
              className="w-2 h-6 bg-yellow-400 rounded-t-full"
              style={{
                boxShadow: '0 0 8px rgba(255,215,0,0.5)',
              }}
            />
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{
                backgroundColor: ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff'][i % 6],
                animationDelay: `${i * 0.15}s`,
                boxShadow: `0 0 15px ${['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff'][i % 6]}`,
                filter: 'brightness(1.2)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </>
  );
}
