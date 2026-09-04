import { AppShell } from '@/components/AppShell';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { getUserSettings } from '@/lib/user/get-user-settings';

export const metadata = {
  title: 'Configurações — Pequenos Discípulos',
  description: 'Gerir preferências, perfil e limites de uso da sua conta.',
};

export default async function ConfiguracoesPage() {
  const settings = await getUserSettings();

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-vida text-3xl">settings</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">
              Configurações
            </h1>
          </div>
          <p className="text-oliva text-base md:text-lg max-w-2xl">
            Personalize a experiência, veja o seu perfil e acompanhe os limites de geração de
            conteúdo.
          </p>
        </header>

        <SettingsContent initialSettings={settings} />
      </div>
    </AppShell>
  );
}
