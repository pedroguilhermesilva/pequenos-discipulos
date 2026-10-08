import { toast } from 'sonner';

/** Mensagem genérica para falhas de rede ou servidor inesperadas. */
export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente de novo.';

const TOAST_OPTIONS = {
  duration: 5000,
  classNames: {
    toast:
      'group toast !rounded-livro !border !border-borda !bg-white !text-tinta !shadow-livro !font-sans !text-sm',
    title: '!font-semibold !text-tinta',
    description: '!text-oliva !text-sm',
    success: '!border-aprovado/30 !bg-aprovado-claro',
    error: '!border-red-200 !bg-red-50',
    info: '!border-ceu/30 !bg-ceu-claro',
    closeButton:
      '!border-borda !bg-white !text-oliva hover:!text-tinta hover:!bg-pergaminho-escuro',
  },
} as const;

export function resolveErrorMessage(message?: string | null): string {
  const trimmed = message?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : GENERIC_ERROR_MESSAGE;
}

export const notify = {
  error(message?: string | null) {
    toast.error(resolveErrorMessage(message), TOAST_OPTIONS);
  },

  success(message: string) {
    toast.success(message, TOAST_OPTIONS);
  },

  info(message: string) {
    toast.info(message, TOAST_OPTIONS);
  },
};
