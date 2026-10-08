export type ContentModerationResult = {
  flagged: boolean;
  categories: string[];
};

export interface ContentModerationProvider {
  moderate(text: string): Promise<ContentModerationResult>;
}
