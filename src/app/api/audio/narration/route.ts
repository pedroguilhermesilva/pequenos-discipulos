import { NextResponse } from 'next/server';
import { z } from 'zod';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';

const narrationSchema = z.object({
  adaptationId: z.string().min(1),
  pageIndex: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const body = narrationSchema.parse(await request.json());

    const result = await container.services.audio.ensurePageNarration(
      body.adaptationId,
      body.pageIndex
    );

    return NextResponse.json({
      ok: true,
      data: {
        url: result.url,
        alignment: result.alignment,
        startSeconds: result.startSeconds,
        endSeconds: result.endSeconds,
        durationMs: result.durationMs,
        pages: result.pages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'adaptationId e pageIndex são obrigatórios.' },
        { status: 400 }
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ ok: false, message: 'Falha ao gerar narração.' }, { status: 500 });
  }
}
