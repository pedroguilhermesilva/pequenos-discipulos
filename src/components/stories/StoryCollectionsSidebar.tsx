'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getStoryHref, type StorySummary } from '@/lib/stories';
import { getChildStoriesAction } from '@/lib/stories/library-actions';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { CommunityVersionsPanel } from '@/components/stories/CommunityVersionsPanel';

interface StoryCollectionsSidebarProps {
  currentStory: StorySummary;
  childName?: string;
  adaptationId?: string;
  viewingAdaptationId?: string;
  onSelectVersion?: (adaptationId: string) => void;
  onAdopted?: (payload: { adaptationId: string; userStoryId: string }) => void;
}

const PREVIEW_LIMIT = 3;

function buildPreviewItems(
  childStories: StorySummary[],
  currentStory: StorySummary
) {
  const allItems =
    childStories.length > 0
      ? childStories.map((story) => ({
          id: story.id,
          title: story.title,
          href: getStoryHref(story),
          emoji: story.isFavorite ? '⭐' : '📖',
          current: story.id === currentStory.id,
        }))
      : [
          {
            id: currentStory.id,
            title: currentStory.title,
            href: getStoryHref(currentStory),
            emoji: '⭐',
            current: true,
          },
        ];

  const currentItem = allItems.find((item) => item.current);
  const otherItems = allItems.filter((item) => !item.current);

  const previewItems = currentItem
    ? [currentItem, ...otherItems.slice(0, PREVIEW_LIMIT - 1)]
    : allItems.slice(0, PREVIEW_LIMIT);

  return { allItems, previewItems };
}

export function StoryCollectionsSidebar({
  currentStory,
  childName = 'Davi',
  adaptationId,
  viewingAdaptationId,
  onSelectVersion,
  onAdopted,
}: StoryCollectionsSidebarProps) {
  const { activeProfile } = useChildProfiles();
  const { data: childStories = [] } = useQuery({
    queryKey: ['child-stories', activeProfile?.id ?? 'none'],
    queryFn: () => getChildStoriesAction(activeProfile?.id),
    enabled: Boolean(activeProfile?.id),
  });

  const { allItems, previewItems } = buildPreviewItems(childStories, currentStory);

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-livro-xl p-5 border border-borda shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-tinta flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-base text-laranja shrink-0">favorite</span>
            <span className="truncate">Coleções de {childName}</span>
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold bg-pergaminho-escuro text-oliva px-2 py-0.5 rounded-md">
              {allItems.length} histórias
            </span>
            <Link
              href="/biblioteca"
              className="w-6 h-6 rounded-md flex items-center justify-center text-oliva hover:text-laranja hover:bg-pergaminho-escuro transition focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              aria-label="Ver biblioteca completa"
            >
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        <ul className="space-y-2 text-xs">
          {previewItems.map((item) => (
            <li key={item.id}>
              {item.current ? (
                <div className="p-2.5 rounded-xl bg-laranja-suave border border-laranja/25 flex items-center justify-between font-bold text-tinta">
                  <span className="flex items-center gap-2 truncate">
                    {item.emoji} {item.title}
                  </span>
                  <span className="material-symbols-outlined text-base text-aprovado shrink-0">
                    check_circle
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="p-2.5 rounded-xl bg-pergaminho-escuro/50 hover:bg-pergaminho-escuro flex items-center justify-between text-oliva transition focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
                >
                  <span className="flex items-center gap-2 truncate">
                    {item.emoji} {item.title}
                  </span>
                  <span className="material-symbols-outlined text-base text-oliva/50 shrink-0">
                    chevron_right
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {adaptationId && onSelectVersion ? (
        <div className="hidden lg:block">
          <CommunityVersionsPanel
            anchorAdaptationId={adaptationId}
            viewingAdaptationId={viewingAdaptationId}
            childName={childName}
            childProfileId={activeProfile?.id}
            onSelectVersion={onSelectVersion}
            onAdopted={onAdopted}
          />
        </div>
      ) : null}

      <div className="hidden xl:block bg-pergaminho-escuro/50 rounded-livro-xl p-4 border border-borda text-xs text-oliva">
        <p className="font-bold text-tinta mb-1">Lendo agora</p>
        <p className="font-display font-bold text-sm text-tinta">{currentStory.title}</p>
        <p className="mt-1">{currentStory.passage}</p>
      </div>
    </aside>
  );
}
