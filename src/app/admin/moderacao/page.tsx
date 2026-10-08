import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ModerationAdminContent } from '@/components/admin/ModerationAdminContent';
import { isAdminEmail } from '@/lib/auth/require-admin';
import { requireCurrentUser } from '@/lib/auth/get-current-user';

export const metadata = {
  title: 'Moderação — Pequenos Discípulos',
  description: 'Revisão manual de versões enviadas à comunidade.',
};

export default async function ModeracaoAdminPage() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    redirect('/home');
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
