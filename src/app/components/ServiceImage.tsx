'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function ServiceImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  width = 800,
  height = 600,
  priority = false
}: ServiceImageProps) {
  const [imageError, setImageError] = useState(false);

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
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setImageError(true)}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}