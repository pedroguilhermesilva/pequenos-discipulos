/** Estilos compartilhados do sonner — uma única fonte para ToasterProvider e notify. */
export const NOTIFY_TOAST_CLASS_NAMES = {
  toast: 'notify-toast group toast',
  title: 'notify-toast-title',
  description: 'notify-toast-description',
  icon: 'notify-toast-icon',
  closeButton: 'notify-toast-close',
  success: 'notify-toast--success',
  error: 'notify-toast--error',
  info: 'notify-toast--info',
  warning: 'notify-toast--warning',
} as const;

export const NOTIFY_TOAST_OPTIONS = {
  duration: 5000,
  classNames: NOTIFY_TOAST_CLASS_NAMES,
} as const;
