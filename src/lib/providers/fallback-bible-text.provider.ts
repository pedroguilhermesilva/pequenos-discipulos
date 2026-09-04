import type {
  BiblePassageText,
  BibleTextProvider,
  FetchPassageParams,
} from '@/lib/providers/interfaces/bible-text.provider';

/**
 * Tries the primary provider (e.g. YouVersion) and falls back when unavailable.
 * Keeps local/dev flows working when a Bible version is not licensed yet.
 */
export class FallbackBibleTextProvider implements BibleTextProvider {
  constructor(
    private readonly primary: BibleTextProvider,
    private readonly fallback: BibleTextProvider,
    private readonly onFallback?: (error: unknown, params: FetchPassageParams) => void
  ) {}

  async fetchPassage(params: FetchPassageParams): Promise<BiblePassageText> {
    try {
      return await this.primary.fetchPassage(params);
    } catch (error) {
      this.onFallback?.(error, params);
      return this.fallback.fetchPassage(params);
    }
  }

  async listVersions(language?: string) {
    if (this.primary.listVersions) {
      try {
        return await this.primary.listVersions(language);
      } catch {
        // ignore
      }
    }
    return this.fallback.listVersions?.(language) ?? [];
  }
}
