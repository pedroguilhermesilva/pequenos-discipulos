export function parseGoogleTtsError(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return 'Credenciais do Google TTS inválidas ou API Text-to-Speech não ativada. Verifique GOOGLE_TTS_API_KEY ou GOOGLE_TTS_CREDENTIALS_JSON.';
  }

  if (status === 400) {
    if (body.includes('SSML') || body.includes('ssml')) {
      return 'O texto enviado ao Google TTS contém SSML inválido.';
    }
    return 'Pedido inválido ao Google TTS. Verifique GOOGLE_TTS_VOICE e o texto.';
  }

  if (status === 429) {
    return 'Limite de uso do Google TTS excedido. Tente novamente mais tarde.';
  }

  return `Google TTS respondeu com erro ${status}.`;
}
