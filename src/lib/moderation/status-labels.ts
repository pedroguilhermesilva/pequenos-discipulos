import type { AdaptationStatus } from '@prisma/client';

const STATUS_LABELS: Record<AdaptationStatus, string> = {
  draft: 'Rascunho (só sua família)',
  family_approved: 'Aprovada em família',
  pending_review: 'Em revisão',
  pending_manual_review: 'Em revisão manual',
  community: 'Aprovada na comunidade',
  rejected: 'Recusada',
  withdrawn: 'Retirada da comunidade',
  as_default: 'Versão padrão',
};

export function getAdaptationStatusLabel(status: AdaptationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export type ShareButtonState = {
  disabled: boolean;
  label: string;
};

export function getShareButtonState(status: AdaptationStatus | string | null): ShareButtonState {
  switch (status) {
    case 'community':
    case 'as_default':
      return { disabled: true, label: 'Já está na comunidade' };
    case 'pending_review':
    case 'pending_manual_review':
      return { disabled: true, label: 'Aguardando revisão' };
    case 'rejected':
      return { disabled: false, label: 'Tentar compartilhar de novo' };
    case 'withdrawn':
      return { disabled: false, label: 'Compartilhar com a comunidade' };
    default:
      return { disabled: false, label: 'Compartilhar com a comunidade' };
  }
}

export function getShareSubmitFeedback(
  status: AdaptationStatus | string,
  reason?: string | null
): { message: string; variant: 'success' | 'info' | 'error' } {
  switch (status) {
    case 'community':
    case 'as_default':
      return {
        variant: 'success',
        message: 'Parabéns! Sua versão foi aprovada e já está na comunidade.',
      };
    case 'pending_manual_review':
      return {
        variant: 'info',
        message: 'Vai para revisão manual. Nossa equipe vai analisar em breve.',
      };
    case 'rejected':
      return {
        variant: 'error',
        message:
          reason ??
          'Essa versão não pôde entrar na comunidade. Tente adaptar a história de outro jeito.',
      };
    case 'pending_review':
      return {
        variant: 'info',
        message: 'Enviada para revisão. Em breve você saberá o resultado.',
      };
    default:
      return {
        variant: 'info',
        message: 'Enviada para revisão.',
      };
  }
}

export function getFamilyModerationMessage(
  status: AdaptationStatus,
  moderationReason?: string | null
): string | null {
  switch (status) {
    case 'pending_review':
      return 'Sua versão está sendo revisada. Em breve você saberá se ela entra na comunidade.';
    case 'pending_manual_review':
      return 'Sua versão está em revisão manual. Nossa equipe vai analisar em breve.';
    case 'community':
      return 'Parabéns! Sua versão foi aprovada e já está na comunidade.';
    case 'rejected':
      return (
        moderationReason ??
        'Essa versão não pôde entrar na comunidade. Tente adaptar a história de outro jeito.'
      );
    case 'withdrawn':
      return (
        moderationReason ??
        'Esta versão foi retirada da comunidade. Entre em contato se tiver dúvidas.'
      );
    default:
      return null;
  }
}
