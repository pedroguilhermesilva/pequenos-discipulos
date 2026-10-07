import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { toActionError } from '@/lib/domain/errors';

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const data = await container.services.userData.exportUserData(user.id);

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="pequenos-discipulos-dados-${user.id.slice(0, 8)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const result = toActionError(error);
    if (!result.ok) {
      const status = result.code === 'UNAUTHORIZED' ? 401 : 500;
      return NextResponse.json({ ok: false, message: result.message }, { status });
    }
    return NextResponse.json({ ok: false, message: 'Erro interno.' }, { status: 500 });
  }
}
