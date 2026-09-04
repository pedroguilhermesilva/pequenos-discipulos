'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChildProfileAvatar } from '@/components/profiles/ChildProfileAvatar';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ChipToggle } from '@/components/ui/ChipToggle';
import { SelectionCard } from '@/components/ui/SelectionCard';
import {
  ageGroups,
  bibleVersions,
  getAgeGroupLabel,
  getBibleVersionLabel,
  getLanguageStyleLabel,
  getPreferredFormatLabel,
  getReadingGoalLabel,
  getThemeLabel,
  getUsageFrequencyLabel,
  languageStyles,
  preferredFormats,
  readingGoals,
  themes,
  usageFrequencies,
} from '@/lib/onboarding/constants';
import { MAX_CHILD_PROFILES } from '@/lib/profiles/constants';
import { getProfileDisplayName } from '@/lib/profiles/normalize';
import type { ChildProfile } from '@/lib/profiles/types';
import type { ThemeId, UserPreferences } from '@/lib/onboarding/types';
import { saveUserPreferences } from '@/lib/user/actions';
import { cn } from '@/lib/cn';

interface ProfilePreferencesAccordionProps {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  isDemo: boolean;
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-borda/60 last:border-0">
      <span className="text-sm text-oliva font-medium">{label}</span>
      <span className="text-sm font-semibold text-tinta">{value}</span>
    </div>
  );
}

interface ProfileAccordionItemProps {
  profile: ChildProfile;
  isActive: boolean;
  isOpen: boolean;
  isDemo: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
}

function ProfileAccordionItem({
  profile,
  isActive,
  isOpen,
  isDemo,
  canDelete,
  onToggle,
  onSelect,
  onDelete,
  onSaved,
  onError,
}: ProfileAccordionItemProps) {
  const { updateProfileById } = useChildProfiles();
  const [preferences, setPreferences] = useState<UserPreferences>(profile.preferences);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelId = `profile-panel-${profile.id}`;
  const headerId = `profile-header-${profile.id}`;
  const displayName = getProfileDisplayName(profile);

  useEffect(() => {
    if (!editing) {
      setPreferences(profile.preferences);
    }
  }, [profile, editing]);

  useEffect(() => {
    if (!isOpen && editing) {
      setEditing(false);
      setPreferences(profile.preferences);
    }
  }, [isOpen, editing, profile.preferences]);

  const toggleTheme = (themeId: ThemeId) => {
    setPreferences((prev) => ({
      ...prev,
      themes: prev.themes.includes(themeId)
        ? prev.themes.filter((t) => t !== themeId)
        : [...prev.themes, themeId],
    }));
  };

  const handleSave = () => {
    const syncedName = preferences.childName.trim() || profile.name;

    updateProfileById(profile.id, {
      preferences: { ...preferences, childName: syncedName },
      name: syncedName,
    });

    startTransition(async () => {
      if (isDemo) {
        setEditing(false);
        onSaved?.(`Preferências de ${syncedName} guardadas neste dispositivo.`);
        return;
      }

      if (isActive) {
        const result = await saveUserPreferences({ ...preferences, childName: syncedName });
        if (result.success) {
          setEditing(false);
          onSaved?.(`Preferências de ${syncedName} atualizadas com sucesso.`);
        } else {
          onError?.(result.error ?? 'Erro ao guardar.');
        }
        return;
      }

      setEditing(false);
      onSaved?.(`Preferências de ${syncedName} guardadas neste dispositivo.`);
    });
  };

  const handleCancel = () => {
    setPreferences(profile.preferences);
    setEditing(false);
  };

  const handleExpandKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  const expandLabel = isOpen
    ? `Recolher preferências de ${displayName}`
    : `Expandir preferências de ${displayName}`;

  return (
    <div className="border-b border-borda last:border-b-0">
      <div
        id={headerId}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={expandLabel}
        onClick={onToggle}
        onKeyDown={handleExpandKeyDown}
        className={cn(
          'flex items-center gap-2 w-full px-4 py-4 md:px-6 transition-colors cursor-pointer',
          'hover:bg-pergaminho/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vida',
          isOpen && 'bg-pergaminho/30 hover:bg-pergaminho/40'
        )}
      >
        <div className="flex flex-1 min-w-0 items-center gap-4 text-left">
          <ChildProfileAvatar profile={profile} size="md" active={isActive} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-tinta">{displayName}</p>
              {isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-laranja/15 text-laranja rounded-full">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-oliva mt-0.5">
              {getAgeGroupLabel(profile.preferences.ageGroup)}
            </p>
          </div>
        </div>
        {!isActive && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold text-vida hover:bg-vida/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
          >
            Usar
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="shrink-0 p-1.5 text-oliva hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={`Remover perfil de ${displayName}`}
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        )}
        <span
          className={cn(
            'material-symbols-outlined text-oliva transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          expand_more
        </span>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
        className={cn(!isOpen && 'hidden')}
      >
        <div className="px-4 pb-5 md:px-6 md:pb-6 pt-1">
          <div className="flex justify-end mb-4">
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-vida hover:text-vida-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-8">
              <div>
                <label
                  htmlFor={`child-name-${profile.id}`}
                  className="block text-sm font-semibold text-tinta mb-2"
                >
                  Nome da criança
                </label>
                <input
                  id={`child-name-${profile.id}`}
                  type="text"
                  value={preferences.childName}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, childName: e.target.value }))
                  }
                  className="w-full h-12 rounded-livro border border-borda bg-white text-tinta px-4 focus:ring-2 focus:ring-vida focus:border-vida outline-none transition-all"
                  placeholder="Ex: Davi"
                />
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Idade</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ageGroups.map((group) => (
                    <SelectionCard
                      key={group.id}
                      selected={preferences.ageGroup === group.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, ageGroup: group.id }))
                      }
                      icon={group.icon}
                      label={group.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Temas preferidos</span>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <ChipToggle
                      key={theme.id}
                      selected={preferences.themes.includes(theme.id)}
                      onClick={() => toggleTheme(theme.id)}
                      label={theme.label}
                      themeId={theme.id}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Estilo de linguagem</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {languageStyles.map((style) => (
                    <SelectionCard
                      key={style.id}
                      selected={preferences.languageStyle === style.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, languageStyle: style.id }))
                      }
                      icon={style.icon}
                      label={style.label}
                      sublabel={style.sublabel}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Objetivo da leitura</span>
                <div className="flex flex-wrap gap-2">
                  {readingGoals.map((goal) => (
                    <ChipToggle
                      key={goal.id}
                      selected={preferences.readingGoal === goal.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, readingGoal: goal.id }))
                      }
                      label={goal.label}
                      icon={goal.icon}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Formato preferido</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {preferredFormats.map((format) => (
                    <SelectionCard
                      key={format.id}
                      selected={preferences.preferredFormat === format.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, preferredFormat: format.id }))
                      }
                      icon={format.icon}
                      label={format.label}
                      sublabel={format.sublabel}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Versão da Bíblia</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {bibleVersions.map((version) => (
                    <SelectionCard
                      key={version.id}
                      selected={preferences.bibleVersionId === version.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, bibleVersionId: version.id }))
                      }
                      icon="menu_book"
                      label={version.abbreviation}
                      sublabel={version.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-tinta">Frequência de uso</span>
                <div className="flex flex-wrap gap-2">
                  {usageFrequencies.map((freq) => (
                    <ChipToggle
                      key={freq.id}
                      selected={preferences.usageFrequency === freq.id}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, usageFrequency: freq.id }))
                      }
                      label={freq.label}
                      icon={freq.icon}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className={cn(
                    'px-5 py-2.5 bg-gradient-to-r from-amber to-laranja text-white font-bold text-sm rounded-livro',
                    'hover:from-amber/90 hover:to-laranja/90 transition-all disabled:opacity-60',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja'
                  )}
                >
                  {isPending ? 'A guardar…' : 'Guardar preferências'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-borda text-tinta font-semibold text-sm rounded-livro hover:bg-pergaminho-escuro transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <PreferenceRow label="Nome da criança" value={displayName} />
              <PreferenceRow label="Idade" value={getAgeGroupLabel(preferences.ageGroup)} />
              <PreferenceRow
                label="Temas"
                value={
                  preferences.themes.length > 0
                    ? preferences.themes.map(getThemeLabel).join(', ')
                    : 'Nenhum selecionado'
                }
              />
              <PreferenceRow
                label="Estilo de linguagem"
                value={getLanguageStyleLabel(preferences.languageStyle)}
              />
              <PreferenceRow
                label="Objetivo da leitura"
                value={getReadingGoalLabel(preferences.readingGoal)}
              />
              <PreferenceRow
                label="Formato preferido"
                value={getPreferredFormatLabel(preferences.preferredFormat)}
              />
              <PreferenceRow
                label="Frequência de uso"
                value={getUsageFrequencyLabel(preferences.usageFrequency)}
              />
              <PreferenceRow
                label="Versão da Bíblia"
                value={getBibleVersionLabel(preferences.bibleVersionId)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfilePreferencesAccordion({
  profiles,
  activeProfileId,
  isDemo,
  onSaved,
  onError,
}: ProfilePreferencesAccordionProps) {
  const router = useRouter();
  const { selectProfile, removeProfile } = useChildProfiles();
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'delete' | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const canAddProfile = profiles.length < MAX_CHILD_PROFILES;
  const canDelete = profiles.length > 1;

  const handleToggle = (profileId: string) => {
    setOpenProfileId((current) => (current === profileId ? null : profileId));
  };

  const handleAddClick = () => {
    setPendingAction('add');
    setParentGateOpen(true);
  };

  const handleDeleteClick = (profileId: string) => {
    setProfileToDelete(profileId);
    setPendingAction('delete');
    setParentGateOpen(true);
  };

  const handleParentGateSuccess = () => {
    if (pendingAction === 'add') {
      router.push('/onboarding/step-1?modo=novo');
    } else if (pendingAction === 'delete' && profileToDelete) {
      removeProfile(profileToDelete);
    }
    setPendingAction(null);
    setProfileToDelete(null);
  };

  return (
    <>
      <SettingsSection
        id="preferencias-filhos"
        title="Preferências por filho"
        description="Cada filho tem configurações próprias para personalizar as histórias."
        icon="tune"
        className="overflow-hidden"
        contentClassName="p-0"
        action={
          canAddProfile ? (
            <button
              type="button"
              onClick={handleAddClick}
              className="text-sm font-semibold text-vida hover:text-vida-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            >
              Adicionar
            </button>
          ) : null
        }
      >
        <div className="-mt-0">
          {profiles.map((profile) => (
            <ProfileAccordionItem
              key={profile.id}
              profile={profile}
              isActive={activeProfileId === profile.id}
              isOpen={openProfileId === profile.id}
              isDemo={isDemo}
              canDelete={canDelete}
              onToggle={() => handleToggle(profile.id)}
              onSelect={() => selectProfile(profile.id)}
              onDelete={() => handleDeleteClick(profile.id)}
              onSaved={onSaved}
              onError={onError}
            />
          ))}

          {profiles.length >= MAX_CHILD_PROFILES && (
            <p className="text-xs text-oliva/80 px-4 py-3 md:px-6 border-t border-borda">
              Limite de {MAX_CHILD_PROFILES} perfis atingido. Remova um perfil para adicionar outro.
            </p>
          )}
        </div>
      </SettingsSection>

      <ParentGateModal
        open={parentGateOpen}
        onClose={() => {
          setParentGateOpen(false);
          setPendingAction(null);
          setProfileToDelete(null);
        }}
        onSuccess={handleParentGateSuccess}
      />
    </>
  );
}
