import type { StorageProvider } from '@/lib/providers/interfaces/storage.provider';
import type { StorageAccessService } from '@/lib/services/storage-access.service';
import { isSafeStoragePath, normalizeStoragePath } from '@/lib/storage/audio-storage-path';

export type StorageGetResult = {
  status: number;
  stream?: ReadableStream<Uint8Array>;
  headers?: Record<string, string>;
};

export async function resolveStorageGet(params: {
  pathSegments: string[];
  userId: string | null;
  storageAccess: StorageAccessService;
  storage: StorageProvider;
}): Promise<StorageGetResult> {
  if (!params.userId) {
    return { status: 401 };
  }

  const relativePath = normalizeStoragePath(params.pathSegments);
  if (!isSafeStoragePath(relativePath)) {
    return { status: 400 };
  }

  const allowed = await params.storageAccess.userCanReadAudioPath(
    params.userId,
    relativePath
  );
  if (!allowed) {
    return { status: 404 };
  }

  const file = await params.storage.read(relativePath);
  if (!file) {
    return { status: 404 };
  }

  return {
    status: 200,
    stream: file.stream,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  };
}
