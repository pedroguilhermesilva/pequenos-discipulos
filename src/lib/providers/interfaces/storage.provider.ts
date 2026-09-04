export interface StorageProvider {
  save(relativePath: string, data: Buffer, contentType?: string): Promise<string>;
  getPublicUrl(relativePath: string): string;
  exists(relativePath: string): Promise<boolean>;
  delete(relativePath: string): Promise<void>;
}
