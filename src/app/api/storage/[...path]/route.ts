import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { resolveStorageGet } from '@/lib/storage/resolve-storage-get';

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const userId = await getSessionUserId();
    const result = await resolveStorageGet({
      pathSegments: path,
      userId,
      storageAccess: container.services.storageAccess,
      storage: container.providers.storage,
    });

    if (result.status === 401) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (result.status === 400) {
      return new NextResponse('Bad Request', { status: 400 });
    }
    if (result.status === 404 || !result.stream) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: result.headers,
    });
  } catch (error) {
    console.error('[storage] Falha ao servir arquivo', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
