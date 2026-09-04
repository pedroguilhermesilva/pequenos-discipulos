'use client';

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

interface LibraryCarouselProps {
  children: ReactNode;
  ariaLabel: string;
}

const OVERFLOW_THRESHOLD_PX = 2;
const CAROUSEL_GAP_PX = 16;
/** Fallback for browsers without `scrollend`. */
const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 700;

function getSlideOffsetLeft(container: HTMLElement, slide: HTMLElement): number {
  return (
    container.scrollLeft +
    (slide.getBoundingClientRect().left - container.getBoundingClientRect().left)
  );
}

/** Mirrors NON_NAV_*_SLIDE_WIDTH so the nav decision never depends on the rendered mode. */
function getCompactSlideMaxWidthPx(slideCount: number): number {
  if (typeof window === 'undefined') return 320;

  const isPair = slideCount === 2;
  if (window.matchMedia('(min-width: 768px)').matches) return isPair ? 360 : 400;
  if (window.matchMedia('(min-width: 640px)').matches) return isPair ? 340 : 360;
  return 320;
}

/** Fixed widths so slides match card content instead of stretching to % of the row. */
const CAROUSEL_SLIDE_WIDTH =
  'w-[min(88%,320px)] sm:w-[min(75%,340px)] md:w-[360px]';

/** Compact list-item widths when carousel nav is hidden */
const NON_NAV_SINGLE_SLIDE_WIDTH =
  'w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px]';

const NON_NAV_PAIR_SLIDE_WIDTH =
  'max-w-[320px] sm:max-w-[340px] md:max-w-[360px]';

/** Caps two-card rows: 2 × slide max + 1rem gap */
const NON_NAV_PAIR_ROW_WIDTH =
  'max-w-[656px] sm:max-w-[696px] md:max-w-[736px]';

function getNonNavSlideClass(slideCount: number): string {
  if (slideCount === 1) {
    return cn('flex-none', NON_NAV_SINGLE_SLIDE_WIDTH);
  }

  if (slideCount === 2) {
    return cn('flex-none w-[calc(50%-0.5rem)]', NON_NAV_PAIR_SLIDE_WIDTH);
  }

  return cn('min-w-0 flex-1', NON_NAV_SINGLE_SLIDE_WIDTH);
}

export function LibraryCarousel({ children, ariaLabel }: LibraryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const prefersReducedMotion = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimeout = useRef(0);
  const slides = Children.toArray(children);
  const slideCount = slides.length;

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const scrollToSlide = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el || slideCount === 0) return;

      const clamped = Math.max(0, Math.min(index, slideCount - 1));
      const slide = el.querySelectorAll<HTMLElement>('[data-carousel-slide]')[clamped];
      if (!slide) return;

      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const isLastSlide = clamped === slideCount - 1;
      const left = isLastSlide
        ? maxScroll
        : Math.max(0, Math.min(getSlideOffsetLeft(el, slide), maxScroll));
      const behavior = prefersReducedMotion.current ? 'auto' : 'smooth';

      // Intermediate slides would otherwise light up while the animation runs.
      isProgrammaticScroll.current = true;
      window.clearTimeout(programmaticScrollTimeout.current);
      programmaticScrollTimeout.current = window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, PROGRAMMATIC_SCROLL_TIMEOUT_MS);

      el.scrollTo({ left, behavior });
      setActiveIndex(clamped);
    },
    [slideCount]
  );

  const checkOverflow = useCallback(() => {
    const container = containerRef.current;
    if (!container || slideCount <= 1) {
      setIsOverflowing(false);
      return;
    }

    // Two cards always fit side-by-side at their max width — no carousel needed.
    if (slideCount === 2) {
      setIsOverflowing(false);
      return;
    }

    const slideWidth = getCompactSlideMaxWidthPx(slideCount);
    const requiredWidth = slideCount * slideWidth + (slideCount - 1) * CAROUSEL_GAP_PX;

    setIsOverflowing(requiredWidth > container.clientWidth + OVERFLOW_THRESHOLD_PX);
  }, [slideCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || slideCount <= 1) {
      setIsOverflowing(false);
      return;
    }

    let frame = 0;
    const scheduleCheck = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(checkOverflow);
    };

    scheduleCheck();

    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [slideCount, checkOverflow]);

  useEffect(() => {
    if (isOverflowing) return;

    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
    setActiveIndex(0);
  }, [isOverflowing]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || slideCount <= 1) return;

    let frame = 0;

    const updateActiveFromScroll = () => {
      const slideElements = el.querySelectorAll<HTMLElement>('[data-carousel-slide]');
      if (slideElements.length === 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= OVERFLOW_THRESHOLD_PX) {
        setActiveIndex(0);
        return;
      }

      if (el.scrollLeft >= maxScroll - OVERFLOW_THRESHOLD_PX) {
        setActiveIndex(slideElements.length - 1);
        return;
      }

      const viewportLeft = el.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      slideElements.forEach((slide, index) => {
        const slideLeft = getSlideOffsetLeft(el, slide);
        const distance = Math.abs(slideLeft - viewportLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveFromScroll);
    };

    const onScrollEnd = () => {
      isProgrammaticScroll.current = false;
      window.clearTimeout(programmaticScrollTimeout.current);
      updateActiveFromScroll();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    updateActiveFromScroll();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
    };
  }, [slideCount, children]);

  useEffect(() => () => window.clearTimeout(programmaticScrollTimeout.current), []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToSlide(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToSlide(activeIndex + 1);
    }
  };

  if (slideCount === 0) return null;

  const showNav = slideCount > 1 && isOverflowing;

  return (
    <div ref={containerRef} className="relative">
      <div className={cn('relative', showNav && 'md:px-12 lg:px-14')}>
        {showNav && (
          <>
            <CarouselArrow
              direction="prev"
              onClick={() => scrollToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="hidden md:inline-flex absolute left-0 top-1/2 z-10 -translate-y-1/2"
            />
            <CarouselArrow
              direction="next"
              onClick={() => scrollToSlide(activeIndex + 1)}
              disabled={activeIndex === slideCount - 1}
              className="hidden md:inline-flex absolute right-0 top-1/2 z-10 -translate-y-1/2"
            />
          </>
        )}

        <div
          ref={scrollRef}
          role="region"
          aria-roledescription="carrossel"
          aria-label={ariaLabel}
          tabIndex={showNav ? 0 : undefined}
          onKeyDown={showNav ? handleKeyDown : undefined}
          className={cn(
            'flex items-stretch gap-4 scrollbar-hide',
            showNav
              ? 'overflow-x-auto snap-x snap-mandatory scroll-ps-4 sm:scroll-ps-6 motion-reduce:scroll-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2 rounded-livro'
              : cn(
                  'overflow-x-hidden',
                  slideCount === 2 && NON_NAV_PAIR_ROW_WIDTH
                )
          )}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              data-carousel-slide
              aria-hidden={showNav ? index !== activeIndex : false}
              className={cn(
                'flex h-full',
                showNav
                  ? cn(
                      'flex-none snap-always',
                      CAROUSEL_SLIDE_WIDTH,
                      index === slideCount - 1 ? 'snap-end' : 'snap-start'
                    )
                  : getNonNavSlideClass(slideCount)
              )}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="mt-4 flex justify-center md:hidden">
          <CarouselDots
            slideCount={slideCount}
            activeIndex={activeIndex}
            ariaLabel={ariaLabel}
            onSelect={scrollToSlide}
          />
        </div>
      )}

      {showNav && (
        <p className="sr-only" aria-live="polite">
          Slide {activeIndex + 1} de {slideCount}
        </p>
      )}
    </div>
  );
}

function CarouselDots({
  slideCount,
  activeIndex,
  ariaLabel,
  onSelect,
}: {
  slideCount: number;
  activeIndex: number;
  ariaLabel: string;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={`Slides de ${ariaLabel}`}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: slideCount }, (_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-label={`Ir para slide ${index + 1} de ${slideCount}`}
          aria-selected={index === activeIndex}
          aria-current={index === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            'rounded-full transition-all motion-reduce:transition-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2',
            index === activeIndex
              ? 'w-6 h-2.5 bg-vida'
              : 'w-2.5 h-2.5 bg-borda hover:bg-vida/40'
          )}
        />
      ))}
    </div>
  );
}

function CarouselArrow({
  direction,
  onClick,
  disabled,
  className,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  className?: string;
}) {
  const label = direction === 'prev' ? 'Slide anterior' : 'Slide seguinte';
  const icon = direction === 'prev' ? 'chevron_left' : 'chevron_right';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-livro border border-borda bg-white text-tinta shadow-livro transition-colors',
        'hover:border-laranja/40 hover:bg-laranja-suave hover:text-laranja',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        className
      )}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  );
}
