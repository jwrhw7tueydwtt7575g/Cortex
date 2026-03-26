'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function CloudBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cloudColor = mounted && theme === 'dark' ? '#ffffff' : '#94a3b8';

  return (
    <>
      {/* Floating clouds */}
      <div className="fixed top-12 left-20 w-32 h-16 opacity-20 animate-cloud-drift pointer-events-none z-10" suppressHydrationWarning>
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <defs>
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          <path
            d="M 15 30 Q 10 15 25 15 Q 35 5 45 15 Q 60 10 65 25 Q 75 20 80 30 Z"
            fill={cloudColor}
            filter="url(#blur)"
          />
        </svg>
      </div>

      <div className="fixed top-1/3 right-10 w-40 h-20 opacity-15 animate-cloud-drift pointer-events-none z-10" style={{ animationDelay: '5s' }} suppressHydrationWarning>
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <defs>
            <filter id="blur2">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          <path
            d="M 15 30 Q 10 15 25 15 Q 35 5 45 15 Q 60 10 65 25 Q 75 20 80 30 Z"
            fill={cloudColor}
            filter="url(#blur2)"
          />
        </svg>
      </div>

      <div className="fixed bottom-1/4 left-1/3 w-36 h-18 opacity-10 animate-cloud-drift pointer-events-none z-10" style={{ animationDelay: '10s' }} suppressHydrationWarning>
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <defs>
            <filter id="blur3">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          <path
            d="M 15 30 Q 10 15 25 15 Q 35 5 45 15 Q 60 10 65 25 Q 75 20 80 30 Z"
            fill={cloudColor}
            filter="url(#blur3)"
          />
        </svg>
      </div>
    </>
  );
}
