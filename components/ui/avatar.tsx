import React from 'react';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

interface AvatarFallbackProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Avatar({ className = '', children }: AvatarProps) {
  return (
    <div className={`
      relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full
      ${className}
    `}>
      {children}
    </div>
  );
}

export function AvatarFallback({ className = '', style, children }: AvatarFallbackProps) {
  return (
    <div 
      className={`
        flex h-full w-full items-center justify-center rounded-full bg-gray-100
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
} 