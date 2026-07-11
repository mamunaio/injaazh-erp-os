'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag while rendering React component')) {
      return; // Suppress React 19 DEV warning from next-themes
    }
    originalError(...args);
  };
}

export function ThemeProvider({ 
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
