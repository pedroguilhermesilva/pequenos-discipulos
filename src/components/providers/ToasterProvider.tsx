'use client';

import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';
import { NOTIFY_TOAST_CLASS_NAMES } from '@/lib/notify-toast-styles';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      invert={false}
      theme="light"
      closeButton
      offset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      style={
        {
          '--width': 'min(100vw - 2rem, 22rem)',
        } as CSSProperties
      }
      mobileOffset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: 'Fechar aviso',
        classNames: NOTIFY_TOAST_CLASS_NAMES,
      }}
    />
  );
}
