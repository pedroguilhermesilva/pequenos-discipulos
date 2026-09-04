'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { LibraryCarousel } from '@/components/ui/LibraryCarousel';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { getStoryHref, type StorySummary } from '@/lib/stories';
import { getLibraryStoriesAction } from '@/lib/stories/library-actions';
import { cn } from '@/lib/cn';

export default function BibliotecaPage() {
  return (
    <AppShell>
      <BibliotecaContent />
    </AppShell>
  );
}

function BibliotecaContent() {
  const { activeProfile } = useChildProfiles();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['library', activeProfile?.id ?? 'none'],
    queryFn: () => getLibraryStoriesAction(),
  });

  const inProgress = stories.filter((s) => s.progress !== undefined && s.progress > 0 && s.progress < 100);
  const completed = stories.filter((s) => s.progress === 100);
  const notStarted = stories.filter((s) => !s.progress || s.progress === 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta mb-2">Biblioteca</h1>
        <p className="text-oliva text-lg">
          Todas as histórias bíblicas adaptadas para o seu pequeno.
        </p>
      </header>

      {isLoading && <p className="text-oliva text-sm">A carregar biblioteca...</p>}

      {inProgress.length > 0 && (
        <LibrarySection title="Em andamento" icon="pending">
          <LibraryCarousel ariaLabel="Histórias em andamento">
            {inProgress.map((story) => (
              <StoryListItem key={story.id} story={story} showProgress />
            ))}
          </LibraryCarousel>
        </LibrarySection>
      )}

      {notStarted.length > 0 && (
        <LibrarySection title="Para descobrir" icon="explore">
          <LibraryCarousel ariaLabel="Histórias para descobrir">
            {notStarted.map((story) => (
              <StoryListItem key={story.id} story={story} />
            ))}
          </LibraryCarousel>
        </LibrarySection>
      )}

      {completed.length > 0 && (
        <LibrarySection title="Concluídas" icon="check_circle">
          <LibraryCarousel ariaLabel="Histórias concluídas">
            {completed.map((story) => (
              <StoryListItem key={story.id} story={story} completed />
            ))}
          </LibraryCarousel>
        </LibrarySection>
      )}
    </div>
  );
}

function LibrarySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-bold text-lg text-tinta flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-vida">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function StoryListItem({
  story,
  showProgress,
  completed,
}: {
  story: StorySummary;
  showProgress?: boolean;
  completed?: boolean;
}) {
  return (
    <Link
      href={getStoryHref(story)}
      className={cn(
        'group flex w-full min-w-0 gap-4 p-4 bg-white rounded-livro border border-borda shadow-livro',
        'hover:shadow-livro-lg hover:border-vida/30 transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-vida'
      )}
    >
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <img
          src={story.image}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {completed && (
          <div className="absolute inset-0 bg-vida/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-vida text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-vida uppercase tracking-wider">{story.passage}</p>
        <h3 className="font-display font-bold text-tinta group-hover:text-vida transition-colors truncate">
          {story.title}
        </h3>
        <p className="text-xs text-oliva">{story.ageGroup}</p>

        {showProgress && story.progress !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 bg-borda/60 rounded-full overflow-hidden">
              <div className="h-full bg-vida rounded-full" style={{ width: `${story.progress}%` }} />
            </div>
            <p className="text-[10px] text-oliva mt-1">
              Página {story.currentPage} de {story.totalPages}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
