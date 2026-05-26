import React from 'react';

interface AvatarProps {
  emoji: string;
  nombre: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
};

export function Avatar({ emoji, nombre, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0`}
      title={nombre}
      aria-label={nombre}
    >
      <span role="img" aria-hidden="true">{emoji}</span>
    </div>
  );
}
