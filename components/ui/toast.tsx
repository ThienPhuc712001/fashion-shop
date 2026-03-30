'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastContainer() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  );
}
