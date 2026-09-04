'use client';

import { useState, useTransition } from 'react';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { ProfilePreferencesAccordion } from '@/components/settings/ProfilePreferencesAccordion';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SubscriptionPlansModal } from '@/components/settings/SubscriptionPlansModal';
import { UsageLimitBar } from '@/components/settings/UsageLimitBar';
import { saveUserProfile } from '@/lib/user/actions';
import type { UserSettings } from '@/lib/user/types';
import { cn } from '@/lib/cn';

interface SettingsContentProps {
  initialSettings: UserSettings;
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-borda/60 last:border-0">
      <span className="text-sm text-oliva font-medium">{label}</span>
      <span className="text-sm font-semibold text-tinta">{value}</span>
    </div>
  );
}

export function SettingsContent({ initialSettings }: SettingsContentProps) {
  const { activeProfile, profiles } = useChildProfiles();
  const [settings, setSettings] = useState(initialSettings);
  const [fullName, setFullName] = useState(
    initialSettings.account.fullName ?? initialSettings.preferences.childName
  );
  const [editingProfile, setEditingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const clearMessages = () => {
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleSaveProfile = () => {
    clearMessages();

    startTransition(async () => {
      if (settings.isDemo) {
        setEditingProfile(false);
        setSaveMessage('Inicie sessão para guardar o perfil na conta.');
        return;
      }

      const result = await saveUserProfile({ fullName });
      if (result.success) {
        setSettings((prev) => ({
          ...prev,
          account: { ...prev.account, fullName },
        }));
        setEditingProfile(false);
        setSaveMessage('Perfil atualizado com sucesso.');
      } else {
        setSaveError(result.error ?? 'Erro ao guardar.');
      }
    });
  };

  const handleCancelProfile = () => {
    setFullName(settings.account.fullName ?? settings.preferences.childName);
    setEditingProfile(false);
    clearMessages();
  };

  const displayName = settings.account.fullName ?? 'Utilizador';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {(saveMessage || saveError) && (
        <div
          role="status"
          className={cn(
            'rounded-livro border px-4 py-3 text-sm font-medium',
            saveError
              ? 'bg-dourado/10 border-dourado/30 text-tinta'
              : 'bg-laranja/10 border-laranja/20 text-laranja'
          )}
        >
          {saveError ?? saveMessage}
        </div>
      )}

      {settings.isDemo && (
        <p className="text-xs text-oliva/80 bg-pergaminho-escuro border border-borda rounded-lg px-3 py-2">
          A mostrar dados de exemplo. Inicie sessão para sincronizar preferências e limites reais.
        </p>
      )}

      <SettingsSection
        id="perfil"
        title="Perfil e conta"
        description="Informações da sua conta e responsável pela família."
        icon="person"
        action={
          !editingProfile ? (
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setEditingProfile(true);
              }}
              className="text-sm font-semibold text-vida hover:text-vida-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            >
              Editar
            </button>
          ) : null
        }
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div
            className="w-20 h-20 rounded-full bg-pergaminho-escuro border-2 border-borda flex items-center justify-center shrink-0 overflow-hidden"
            aria-hidden
          >
            {settings.account.avatarUrl ? (
              <img
                src={settings.account.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display font-bold text-2xl text-oliva">{initials}</span>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-semibold text-tinta mb-2">
                    Nome completo
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 rounded-livro border border-borda bg-white text-tinta px-4 focus:ring-2 focus:ring-vida focus:border-vida outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isPending}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber to-laranja text-white font-bold text-sm rounded-livro hover:from-amber/90 hover:to-laranja/90 transition-all disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
                  >
                    {isPending ? 'A guardar…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelProfile}
                    className="px-5 py-2.5 border border-borda text-tinta font-semibold text-sm rounded-livro hover:bg-pergaminho-escuro transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <PreferenceRow label="Nome" value={displayName} />
                <PreferenceRow
                  label="E-mail"
                  value={settings.account.email ?? 'Não disponível (modo demonstração)'}
                />
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-oliva font-medium">Plano</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-laranja/10 border border-laranja/20 rounded-full text-xs font-bold text-laranja uppercase tracking-wide">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                    {settings.usage.tierLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </SettingsSection>

      <ProfilePreferencesAccordion
        profiles={profiles}
        activeProfileId={activeProfile?.id ?? null}
        isDemo={settings.isDemo}
        onSaved={(message) => {
          setSaveError(null);
          setSaveMessage(message);
        }}
        onError={(message) => {
          setSaveMessage(null);
          setSaveError(message);
        }}
      />

      <SettingsSection
        id="limites"
        title="Limites de uso"
        description={`Contagem mensal da conta — renova a ${settings.usage.resetsAt}.`}
        icon="speed"
        onHeaderClick={() => setPlansModalOpen(true)}
        action={
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-vida shrink-0">
            Ver planos
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </span>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 p-3 rounded-livro bg-pergaminho/60 border border-borda">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-laranja">workspace_premium</span>
              <div>
                <p className="text-xs text-oliva">Plano atual</p>
                <p className="font-display font-bold text-tinta">{settings.usage.tierLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlansModalOpen(true)}
              className="text-xs font-bold text-vida hover:text-vida-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded px-2 py-1"
            >
              Comparar planos
            </button>
          </div>

          {settings.usage.limits.map((limit) => (
            <UsageLimitBar key={limit.type} limit={limit} />
          ))}

          {settings.usage.tier === 'free' && (
            <div className="mt-6 p-4 bg-dourado/5 border border-dourado/20 rounded-livro flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span
                className="material-symbols-outlined text-dourado text-3xl shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <div className="flex-1">
                <p className="font-display font-bold text-tinta text-sm">
                  Precisa de mais histórias?
                </p>
                <p className="text-xs text-oliva mt-0.5">
                  O plano Premium oferece limites maiores para texto, áudio e vídeo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlansModalOpen(true)}
                className="shrink-0 px-4 py-2 bg-gradient-to-r from-amber to-laranja text-white font-bold text-xs rounded-lg hover:from-amber/90 hover:to-laranja/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              >
                Ver planos
              </button>
            </div>
          )}
        </div>
      </SettingsSection>

      <SubscriptionPlansModal
        open={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        currentTier={settings.usage.tier}
      />
    </div>
  );
}
