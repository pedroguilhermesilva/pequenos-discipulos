'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      closeButton
      offset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      mobileOffset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'group toast !rounded-livro !border !border-borda !bg-white !text-tinta !shadow-livro !font-sans !text-sm !px-4 !py-3',
          title: '!font-semibold !text-tinta',
          description: '!text-oliva !text-sm',
          success: '!border-aprovado/30 !bg-aprovado-claro',
          error: '!border-red-200 !bg-red-50',
          info: '!border-ceu/30 !bg-ceu-claro',
          closeButton:
            '!border-borda !bg-white !text-oliva hover:!text-tinta hover:!bg-pergaminho-escuro',
        },
      }}
    />
  );
}
