import { NextResponse } from 'next/server';
import { z } from 'zod';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';
import { resolveInteractiveAudioInput } from '@/lib/stories/sound-tag';

const generateAudioSchema = z.object({
  adaptationId: z.string().min(1),
  blockKey: z.string().min(1),
  kind: z.enum(['speech', 'sfx']).optional(),
  text: z.string().min(1),
  sfxPrompt: z.string().optional(),
  tagSom: z.string().optional(),
  textoParaAudio: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = generateAudioSchema.parse(await request.json());

    const resolved =
      body.tagSom && body.textoParaAudio
        ? resolveInteractiveAudioInput({
            tagSom: body.tagSom,
            textoParaAudio: body.textoParaAudio,
          })
        : {
            kind: body.kind ?? 'sfx',
            text: body.text,
            sfxPrompt: body.sfxPrompt,
          };

    const asset = await container.services.audio.ensureBlockAudio(
      body.adaptationId,
      body.blockKey,
      resolved
    );

    return NextResponse.json({
      ok: true,
      data: { url: asset.url, durationMs: asset.durationMs },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'adaptationId, blockKey, kind e text são obrigatórios.' },
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
    return NextResponse.json({ ok: false, message: 'Falha ao gerar áudio.' }, { status: 500 });
  }
}
