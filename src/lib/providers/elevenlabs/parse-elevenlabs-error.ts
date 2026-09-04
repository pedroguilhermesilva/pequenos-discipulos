export function parseElevenLabsError(status: number, errorBody: string): string {
  if (errorBody.includes('paid_plan_required') || status === 402) {
    return 'Esta voz exige plano pago na ElevenLabs. Escolha uma voz padrão ou das suas vozes em ELEVENLABS_TTS_VOICE_ID.';
  }

  if (status === 401) {
    return 'Chave da ElevenLabs inválida. Verifique ELEVENLABS_API_KEY no .env.';
  }

  if (status === 429) {
    return 'Limite de requisições da ElevenLabs atingido. Tente novamente em instantes.';
  }

  if (errorBody) {
    try {
      const parsed = JSON.parse(errorBody) as {
        detail?: { message?: string };
      };
      if (parsed.detail?.message) {
        return parsed.detail.message;
      }
    } catch {
      // fall through
    }
    return errorBody.slice(0, 240);
  }

  return `ElevenLabs respondeu ${status}.`;
}
