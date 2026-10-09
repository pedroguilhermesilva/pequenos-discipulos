import { describe, expect, it } from 'vitest';
import { NOTIFY_TOAST_CLASS_NAMES } from '@/lib/notify-toast-styles';

describe('NOTIFY_TOAST_CLASS_NAMES', () => {
  it('uses semantic class hooks per toast type', () => {
    expect(NOTIFY_TOAST_CLASS_NAMES.toast).toBe('notify-toast group toast');
    expect(NOTIFY_TOAST_CLASS_NAMES.error).toBe('notify-toast--error');
    expect(NOTIFY_TOAST_CLASS_NAMES.success).toBe('notify-toast--success');
    expect(NOTIFY_TOAST_CLASS_NAMES.info).toBe('notify-toast--info');
    expect(NOTIFY_TOAST_CLASS_NAMES.warning).toBe('notify-toast--warning');
  });
});
