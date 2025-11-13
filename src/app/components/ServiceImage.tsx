'use client';

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ServiceImage({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "" 
}: ServiceImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use the image path directly (Next.js serves from public automatically)
  const imageUrl = src;

  if (!src || imageError) {
    return (
      <div className={`bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${className} ${fallbackClassName}`}>
        <div className="text-center">
          <ImageIcon className="h-12 w-12 text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-blue-600 font-medium">Sin imagen</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl ?? undefined}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}