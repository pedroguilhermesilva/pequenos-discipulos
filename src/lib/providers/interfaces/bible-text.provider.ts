export interface BiblePassageText {
  bibleVersionId: string;
  reference: string;
  verses: Array<{ number: number; text: string }>;
  rawText: string;
}

export interface FetchPassageParams {
  bibleVersionId: string;
  /** USFM-like book code, e.g. MAT, GEN */
  bookCode: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
}

export interface BibleTextProvider {
  fetchPassage(params: FetchPassageParams): Promise<BiblePassageText>;
  listVersions?(language?: string): Promise<Array<{ id: string; name: string; abbreviation: string }>>;
}
