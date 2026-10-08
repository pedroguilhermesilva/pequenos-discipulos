import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ModerationAdminContent } from '@/components/admin/ModerationAdminContent';
import { requireAdmin } from '@/lib/auth/require-admin';
import { UnauthorizedError } from '@/lib/domain/errors';

export const metadata = {
  title: 'Moderação — Pequenos Discípulos',
  description: 'Revisão manual de versões enviadas à comunidade.',
};

export default async function ModeracaoAdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/home');
    }
    throw error;
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-3xl">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-laranja text-3xl">gavel</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">
              Moderação da comunidade
            </h1>
          </div>
          <p className="text-oliva text-base md:text-lg">
            Aprove, recuse ou retire versões que a checagem automática não conseguiu decidir sozinha.
          </p>
        </header>

        <ModerationAdminContent />
      </div>
    </AppShell>
  );
}
