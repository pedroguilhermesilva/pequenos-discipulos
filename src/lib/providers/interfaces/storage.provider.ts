export type StorageReadResult = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number;
};

export interface StorageProvider {
  save(relativePath: string, data: Buffer, contentType?: string): Promise<string>;
  getPublicUrl(relativePath: string): string;
  exists(relativePath: string): Promise<boolean>;
  delete(relativePath: string): Promise<void>;
  read(relativePath: string): Promise<StorageReadResult | null>;
}
