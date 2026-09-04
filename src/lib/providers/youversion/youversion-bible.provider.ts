import { BibleTextFetchError } from '@/lib/domain/errors';
import type {
  BiblePassageText,
  BibleTextProvider,
  FetchPassageParams,
} from '@/lib/providers/interfaces/bible-text.provider';

type PassageResponse = {
  id?: string;
  reference?: string;
  content?: string;
  verses?: Array<{ number?: number; text?: string }>;
};

/**
 * YouVersion Platform REST API.
 * Requires YVP_APP_KEY. Non-commercial license — keep behind BibleTextProvider.
 */
export class YouVersionBibleProvider implements BibleTextProvider {
  private readonly baseUrl = 'https://api.youversion.com/v1';

  constructor(private readonly appKey: string) {}

  async fetchPassage(params: FetchPassageParams): Promise<BiblePassageText> {
    if (!this.appKey) {
      throw new BibleTextFetchError('YVP_APP_KEY não configurada.');
    }

    const span = params.verseTo - params.verseFrom + 1;

    if (span === 1) {
      const data = await this.requestPassage(params);
      const mappedVerses =
        data.verses?.map((verse, index) => ({
          number: verse.number ?? params.verseFrom + index,
          text: verse.text?.trim() ?? '',
        })) ?? [];

      if (mappedVerses.length > 0) {
        return this.buildResult(params, data, mappedVerses);
      }

      const text = data.content?.trim() ?? '';
      if (!text) {
        throw new BibleTextFetchError('YouVersion devolveu passagem vazia.');
      }

      return this.buildResult(params, data, [{ number: params.verseFrom, text }]);
    }

    const { verses, reference } = await this.fetchVersesIndividually(params);
    if (verses.length === 0) {
      throw new BibleTextFetchError('YouVersion devolveu passagem vazia.');
    }

    return this.buildResult(params, { reference }, verses);
  }

  async listVersions(language = 'por') {
    const url = `${this.baseUrl}/bibles?language_ranges%5B%5D=${encodeURIComponent(language)}`;
    const response = await fetch(url, {
      headers: { 'X-YVP-App-Key': this.appKey },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new BibleTextFetchError(
        `YouVersion respondeu ${response.status} ao listar versões bíblicas.`
      );
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: number;
        abbreviation?: string;
        localized_title?: string;
        title?: string;
      }>;
    };

    return (data.data ?? []).map((version) => ({
      id: String(version.id),
      name: version.localized_title ?? version.title ?? version.abbreviation ?? String(version.id),
      abbreviation: version.abbreviation ?? String(version.id),
    }));
  }

  private async fetchVersesIndividually(params: FetchPassageParams) {
    const verseNumbers = Array.from(
      { length: params.verseTo - params.verseFrom + 1 },
      (_, index) => params.verseFrom + index
    );

    let reference: string | undefined;

    const verses = await Promise.all(
      verseNumbers.map(async (number) => {
        const data = await this.requestPassage({
          ...params,
          verseFrom: number,
          verseTo: number,
        });
        reference ??= data.reference;
        const text = data.content?.trim() ?? '';
        return text ? { number, text } : null;
      })
    );

    return {
      reference,
      verses: verses.filter((verse): verse is { number: number; text: string } => verse !== null),
    };
  }

  private async requestPassage(params: FetchPassageParams): Promise<PassageResponse> {
    const usfm = `${params.bookCode}.${params.chapter}.${params.verseFrom}-${params.verseTo}`;
    const url = `${this.baseUrl}/bibles/${params.bibleVersionId}/passages/${encodeURIComponent(usfm)}?content_type=text`;

    const response = await fetch(url, {
      headers: { 'X-YVP-App-Key': this.appKey },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new BibleTextFetchError(
        `YouVersion respondeu ${response.status} ao buscar ${usfm}.`
      );
    }

    return (await response.json()) as PassageResponse;
  }

  private buildResult(
    params: FetchPassageParams,
    data: PassageResponse,
    verses: Array<{ number: number; text: string }>
  ): BiblePassageText {
    const rawText = verses.map((verse) => verse.text).join(' ').trim();

    return {
      bibleVersionId: params.bibleVersionId,
      reference:
        data.reference ?? `${params.bookCode} ${params.chapter}:${params.verseFrom}–${params.verseTo}`,
      verses,
      rawText,
    };
  }
}
