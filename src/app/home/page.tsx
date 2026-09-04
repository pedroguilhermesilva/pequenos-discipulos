'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { NewStoryCTA } from '@/components/NewStoryCTA';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { getAgeGroupLabel } from '@/lib/onboarding/constants';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { getStoryHref, type StorySummary } from '@/lib/stories';
import { getLibraryStoriesAction } from '@/lib/stories/library-actions';
import { cn } from '@/lib/cn';

function profileFromPreferences(preferences = DEFAULT_PREFERENCES) {
  return {
    name: preferences.childName,
    ageGroup: getAgeGroupLabel(preferences.ageGroup),
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function StoryCard({ story, variant = 'default' }: { story: StorySummary; variant?: 'default' | 'compact' }) {
  const hasProgress = story.progress !== undefined && story.progress > 0;
  const isComplete = story.progress === 100;

  return (
    <Link
      href={getStoryHref(story)}
      className={cn(
        'group relative bg-white rounded-livro border border-borda shadow-livro overflow-hidden',
        'hover:shadow-livro-lg hover:border-vida/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-vida',
        variant === 'compact' ? 'flex flex-col' : 'flex flex-col sm:flex-row'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden shrink-0',
          variant === 'compact' ? 'aspect-[4/3]' : 'sm:w-48 aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[140px]'
        )}
      >
        <img
          src={story.image}
          alt=""
          className={cn(
            'w-full h-full object-cover group-hover:scale-105 transition-all duration-500',
            isComplete && 'opacity-60 group-hover:opacity-100'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tinta/30 to-transparent" />
        {story.isFavorite && (
          <span
            className="absolute top-2 right-2 material-symbols-outlined text-dourado text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-label="Favorito"
          >
            favorite
          </span>
        )}
        {isComplete && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-laranja text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
            Concluída
          </span>
        )}
      </div>

      <div className={cn('flex flex-col justify-center p-4', variant === 'compact' && 'gap-1')}>
        <p className="text-[10px] font-bold text-vida uppercase tracking-wider">{story.passage}</p>
        <h3 className="font-display font-bold text-tinta text-base leading-snug group-hover:text-vida transition-colors">
          {story.title}
        </h3>
        <p className="text-xs text-oliva mt-0.5">{story.ageGroup}</p>

        {hasProgress && !isComplete && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-oliva mb-1">
              <span>Página {story.currentPage} de {story.totalPages}</span>
              <span>{story.progress}%</span>
            </div>
            <div className="h-1.5 bg-borda/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-vida rounded-full transition-all"
                style={{ width: `${story.progress}%` }}
              />
            </div>
          </div>
        )}

        {variant === 'compact' && (
          <div className="flex flex-wrap gap-1 mt-2">
            {story.themes.map((theme) => (
              <span key={theme} className="text-[10px] px-2 py-0.5 bg-pergaminho-escuro text-oliva rounded-full">
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function HomePageContent() {
  const { activeProfile } = useChildProfiles();
  const preferences = activeProfile?.preferences ?? DEFAULT_PREFERENCES;
  const childProfile = profileFromPreferences(preferences);
  const { data: stories = [] } = useQuery({
    queryKey: ['library', activeProfile?.id ?? 'none'],
    queryFn: () => getLibraryStoriesAction(),
  });
  const continueStory = stories.find(
    (s) => s.progress !== undefined && s.progress > 0 && s.progress < 100
  );
  const recentStories = stories.filter((s) => s.id !== continueStory?.id).slice(0, 3);
  const completedCount = stories.filter((s) => s.progress === 100).length;
  const suggestionStory = recentStories[0] ?? stories[0];

  return (
      <div className="space-y-8 md:space-y-10 animate-fade-in">
        {/* Greeting */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-oliva">
              {getGreeting()}, {childProfile.name}
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-borda rounded-full text-xs font-semibold text-oliva">
              <span className="material-symbols-outlined text-sm text-vida">child_care</span>
              {childProfile.ageGroup}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta leading-tight">
            Prontos para mais uma história?
          </h1>
        </header>

        {/* Create new story */}
        <section aria-label="Criar nova história">
          <div className="bg-gradient-to-br from-laranja/10 via-white to-dourado/5 rounded-livro border border-laranja/20 shadow-livro p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-laranja/15 shrink-0">
              <span
                className="material-symbols-outlined text-laranja text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display font-bold text-xl text-tinta mb-1">
                Pronto para uma nova aventura?
              </h2>
              <p className="text-oliva text-sm leading-relaxed">
                Escolha uma passagem bíblica e crie uma história personalizada para o {childProfile.name}.
              </p>
            </div>
            <NewStoryCTA className="shrink-0 w-full md:w-auto" />
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Resumo da jornada" className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: 'auto_stories', label: 'Histórias', value: stories.length },
            { icon: 'check_circle', label: 'Concluídas', value: completedCount },
            { icon: 'local_fire_department', label: 'Sequência', value: '3 dias' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-livro border border-borda p-4 md:p-5 text-center shadow-livro"
            >
              <span
                className="material-symbols-outlined text-vida text-2xl mb-2"
                style={stat.icon === 'local_fire_department' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {stat.icon}
              </span>
              <p className="font-display font-bold text-xl md:text-2xl text-tinta">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-oliva font-semibold uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        {/* Continue reading */}
        {continueStory && (
          <section aria-labelledby="continue-heading">
            <h2 id="continue-heading" className="sr-only">Continuar lendo</h2>
            <div className="bg-white rounded-livro shadow-livro-lg border border-borda overflow-hidden">
              <div className="px-6 py-4 border-b border-borda bg-pergaminho/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-vida"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_stories
                  </span>
                  <p className="font-display font-bold text-tinta">Continuar de onde parou</p>
                </div>
                <span className="text-xs text-oliva font-semibold">
                  Página {continueStory.currentPage} de {continueStory.totalPages}
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                  <div className="relative w-full md:w-64 aspect-[4/3] rounded-livro overflow-hidden shadow-livro ring-4 ring-pergaminho-escuro shrink-0">
                    <img
                      src={continueStory.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-tinta/20 to-transparent" />
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <p className="text-xs font-bold text-vida uppercase tracking-wider mb-1">
                        {continueStory.passage}
                      </p>
                      <h3 className="font-display text-2xl md:text-3xl font-bold text-tinta">
                        {continueStory.title}
                      </h3>
                      <p className="text-oliva mt-1">{continueStory.ageGroup}</p>
                    </div>

                    <blockquote className="font-story text-lg text-tinta/80 italic border-l-4 border-dourado pl-4 max-w-md mx-auto md:mx-0">
                      Era uma vez, no céu muito azul, uma estrela muito brilhante!
                    </blockquote>

                    <div className="w-full max-w-xs mx-auto md:mx-0">
                      <div className="h-2 bg-borda/60 rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-vida rounded-full transition-all"
                          style={{ width: `${continueStory.progress}%` }}
                        />
                      </div>
                      <Link
                        href={getStoryHref(continueStory)}
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-amber to-laranja text-white font-bold rounded-livro shadow-livro hover:from-amber/90 hover:to-laranja/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2"
                      >
                        Continuar lendo
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Story shelf */}
        <section aria-labelledby="shelf-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="shelf-heading" className="font-display text-xl font-bold text-tinta flex items-center gap-2">
              <span className="material-symbols-outlined text-dourado">shelves</span>
              Sua estante
            </h2>
            <Link
              href="/biblioteca"
              className="text-sm font-semibold text-vida hover:text-vida-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            >
              Ver biblioteca
              <span className="material-symbols-outlined text-base align-middle ml-0.5">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStories.map((story) => (
              <StoryCard key={story.id} story={story} variant="compact" />
            ))}
          </div>
        </section>

        {/* Suggestion */}
        <section
          aria-labelledby="suggestion-heading"
          className="bg-dourado/5 border-2 border-dashed border-dourado/30 rounded-livro p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
        >
          <span
            className="material-symbols-outlined text-dourado text-5xl shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lightbulb
          </span>
          <div className="flex-1 text-center md:text-left">
            <h2 id="suggestion-heading" className="font-display font-bold text-lg text-tinta mb-1">
              Sugestão de hoje
            </h2>
            <p className="text-oliva text-sm leading-relaxed">
              {suggestionStory ? (
                <>
                  Que tal explorar <strong className="text-tinta">{suggestionStory.title}</strong>?
                  Uma história adaptada para a idade do {childProfile.name}.
                </>
              ) : (
                <>
                  Crie a primeira história bíblica adaptada para a idade do {childProfile.name}.
                </>
              )}
            </p>
          </div>
          <Link
            href={suggestionStory ? getStoryHref(suggestionStory) : '/stories/nova'}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-dourado text-tinta font-bold text-sm rounded-livro hover:bg-dourado/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
          >
            Começar
            <span className="material-symbols-outlined text-base">play_arrow</span>
          </Link>
        </section>
      </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <HomePageContent />
    </AppShell>
  );
}
