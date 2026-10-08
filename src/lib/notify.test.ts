import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { GENERIC_ERROR_MESSAGE, notify, resolveErrorMessage } from '@/lib/notify';

describe('resolveErrorMessage', () => {
  it('returns the trimmed message when provided', () => {
    expect(resolveErrorMessage('  Falha ao salvar.  ')).toBe('Falha ao salvar.');
  });

  it('falls back to the generic message for empty values', () => {
    expect(resolveErrorMessage()).toBe(GENERIC_ERROR_MESSAGE);
    expect(resolveErrorMessage('')).toBe(GENERIC_ERROR_MESSAGE);
    expect(resolveErrorMessage('   ')).toBe(GENERIC_ERROR_MESSAGE);
    expect(resolveErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error toasts with resolved messages', () => {
    notify.error('Não foi possível votar.');
    expect(toast.error).toHaveBeenCalledWith(
      'Não foi possível votar.',
      expect.objectContaining({ duration: 5000 })
    );

    notify.error();
    expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE, expect.any(Object));
  });

  it('shows success and info toasts', () => {
    notify.success('Perfil atualizado com sucesso.');
    expect(toast.success).toHaveBeenCalledWith(
      'Perfil atualizado com sucesso.',
      expect.objectContaining({ duration: 5000 })
    );

    notify.info('Enviada para revisão.');
    expect(toast.info).toHaveBeenCalledWith(
      'Enviada para revisão.',
      expect.objectContaining({ duration: 5000 })
    );
  });
});
