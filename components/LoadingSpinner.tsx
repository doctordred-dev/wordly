'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-cyan-400 animate-spin`} />
        <div className="absolute inset-0 blur-xl opacity-50">
          <Loader2 className={`${sizeClasses[size]} text-cyan-400 animate-spin`} />
        </div>
      </div>
      {message && (
        <p className="text-white/60 text-sm md:text-base animate-pulse">{message}</p>
      )}
    </div>
  );
}
