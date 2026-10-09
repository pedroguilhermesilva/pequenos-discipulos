import { toast } from 'sonner';
import { NOTIFY_TOAST_OPTIONS } from '@/lib/notify-toast-styles';

/** Mensagem genérica para falhas de rede ou servidor inesperadas. */
export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente de novo.';

export function resolveErrorMessage(message?: string | null): string {
  const trimmed = message?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : GENERIC_ERROR_MESSAGE;
}

export const notify = {
  error(message?: string | null) {
    toast.error(resolveErrorMessage(message), NOTIFY_TOAST_OPTIONS);
  },

  success(message: string) {
    toast.success(message, NOTIFY_TOAST_OPTIONS);
  },

  info(message: string) {
    toast.info(message, NOTIFY_TOAST_OPTIONS);
  },

  warning(message: string) {
    toast.warning(message, NOTIFY_TOAST_OPTIONS);
  },
};
