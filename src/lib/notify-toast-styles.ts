/** Estilos compartilhados do sonner — uma única fonte para ToasterProvider e notify. */
export const NOTIFY_TOAST_CLASS_NAMES = {
  toast:
    'group toast !rounded-livro !shadow-livro !font-sans !text-sm !px-4 !py-3 !border',
  title: '!font-semibold',
  description: '!text-sm',
  icon: '!shrink-0',
  closeButton:
    '!border-borda !bg-white/90 !text-oliva hover:!text-tinta hover:!bg-pergaminho-escuro',
  success:
    '!border-green-200 !bg-green-50 [&_[data-title]]:!text-green-900 [&_[data-description]]:!text-green-800 [&_[data-icon]]:!text-green-600',
  error:
    '!border-red-200 !bg-red-50 [&_[data-title]]:!text-red-900 [&_[data-description]]:!text-red-800 [&_[data-icon]]:!text-red-600',
  info:
    '!border-ceu/40 !bg-ceu-claro [&_[data-title]]:!text-tinta [&_[data-description]]:!text-oliva [&_[data-icon]]:!text-ceu',
  warning:
    '!border-laranja/35 !bg-laranja-suave [&_[data-title]]:!text-vida-dark [&_[data-description]]:!text-oliva [&_[data-icon]]:!text-laranja',
} as const;

export const NOTIFY_TOAST_OPTIONS = {
  duration: 5000,
  classNames: NOTIFY_TOAST_CLASS_NAMES,
} as const;
