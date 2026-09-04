import { cn } from '@/lib/cn';

interface SettingsSectionProps {
  id: string;
  title: string;
  description?: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onHeaderClick?: () => void;
  className?: string;
  contentClassName?: string;
}

export function SettingsSection({
  id,
  title,
  description,
  icon,
  children,
  action,
  onHeaderClick,
  className,
  contentClassName,
}: SettingsSectionProps) {
  const headerLayoutClass =
    'px-6 py-4 border-b border-borda bg-pergaminho/40 flex items-center justify-between gap-4';

  const headerContent = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="material-symbols-outlined shrink-0 text-2xl text-vida">{icon}</span>
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="font-display text-lg font-bold text-tinta">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-oliva">{description}</p>}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </>
  );

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn(
        'bg-white rounded-livro border border-borda shadow-livro overflow-hidden',
        className
      )}
    >
      {onHeaderClick ? (
        <button
          type="button"
          onClick={onHeaderClick}
          className={cn(
            headerLayoutClass,
            'w-full rounded-t-livro text-left hover:bg-pergaminho-escuro/60 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vida'
          )}
        >
          {headerContent}
        </button>
      ) : (
        <div className={headerLayoutClass}>
          {headerContent}
        </div>
      )}
      <div className={cn('p-6 md:p-8', contentClassName)}>{children}</div>
    </section>
  );
}
