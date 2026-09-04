import Link from 'next/link';
import { contentTypeConfig } from '@/lib/stories/content-type';
import type { FavoriteItem } from '@/lib/stories/types';
import { getPassageIdFromReference } from '@/lib/stories/bible-passages';
import { buildStoryUrl } from '@/lib/stories/story-url';
import { cn } from '@/lib/cn';

interface FavoriteItemCardProps {
  item: FavoriteItem;
}

function formatSavedDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function FavoriteItemCard({ item }: FavoriteItemCardProps) {
  const typeConfig = contentTypeConfig[item.contentType];
  const passageId = item.originalReference
    ? getPassageIdFromReference(item.originalReference)
    : undefined;
  const href =
    passageId
      ? buildStoryUrl(item.id, {
          passageId,
          contentType: item.contentType,
          ready: true,
        })
      : buildStoryUrl(item.id);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col bg-white rounded-livro shadow-livro border border-borda overflow-hidden hover:border-vida/40 hover:shadow-livro-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] shrink-0 bg-pergaminho-escuro overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-oliva/40 text-5xl">{typeConfig.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tinta/30 to-transparent" />
        <span
          className={cn(
            'absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-sm',
            typeConfig.badgeClass
          )}
        >
          <span className="material-symbols-outlined text-sm">{typeConfig.icon}</span>
          {typeConfig.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="space-y-2 flex-1">
          <h3 className="font-display font-bold text-lg text-tinta group-hover:text-vida transition-colors line-clamp-2 min-h-[3.5rem]">
            {item.title}
          </h3>
          <p className="text-sm text-oliva italic line-clamp-1 min-h-5">
            {item.originalReference || '\u00A0'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 mt-auto">
          {item.readingGoal ? (
            <p className="text-xs text-oliva truncate">{item.readingGoal}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-oliva/70 shrink-0">Salvo em {formatSavedDate(item.savedAt)}</p>
        </div>
      </div>
    </Link>
  );
}
