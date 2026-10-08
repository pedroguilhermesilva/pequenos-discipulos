export type GoogleApiErrorInfo = {
  httpStatus: number;
  status?: string;
  reason?: string;
  message: string;
};

type GoogleErrorBody = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<{ '@type'?: string; reason?: string }>;
  };
};

function redactSecrets(text: string): string {
  return text
    .replace(/key=[^&\s"']+/gi, 'key=[redacted]')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]')
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, 'Bearer [redacted]');
}

/** Extrai status/reason/message de uma resposta de erro do Google (sem segredos). */
export function describeGoogleApiError(httpStatus: number, body: string): GoogleApiErrorInfo {
  let parsed: GoogleErrorBody | null = null;
  try {
    parsed = JSON.parse(body) as GoogleErrorBody;
  } catch {
    parsed = null;
  }

  const error = parsed?.error;
  const reason = error?.details?.find((detail) => detail?.reason)?.reason;
  const rawMessage = error?.message ?? body ?? '';

  return {
    httpStatus,
    status: error?.status,
    reason,
    message: redactSecrets(rawMessage).slice(0, 500),
  };
}

/** Log servidor (Vercel) com o motivo real do erro Google, para distinguir causas. */
export function logGoogleApiError(
  context: string,
  info: GoogleApiErrorInfo,
  extra: Record<string, string | undefined> = {}
): void {
  const extras = Object.entries(extra)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  console.error(
    `[${context}] Google respondeu ${info.httpStatus} status=${info.status ?? '-'} reason=${info.reason ?? '-'} ${extras} message="${info.message}"`
  );
}

function suffix(info: GoogleApiErrorInfo): string {
  const code = info.reason ?? info.status ?? String(info.httpStatus);
  return ` (Google: ${info.httpStatus} ${code})`;
}

export function parseGoogleTtsError(status: number, body: string): string {
  const info = describeGoogleApiError(status, body);
  const reason = info.reason ?? '';
  const message = info.message;

  if (reason === 'SERVICE_DISABLED' || /has not been used in project|is disabled/i.test(message)) {
    return `A API Cloud Text-to-Speech não está ativada no projeto da conta de serviço Google.${suffix(info)}`;
  }

  if (reason === 'BILLING_DISABLED' || /billing/i.test(message)) {
    return `O projeto Google não tem a faturação (billing) ativada para o Text-to-Speech.${suffix(info)}`;
  }

  if (reason === 'USER_PROJECT_DENIED' || /permission to use project/i.test(message)) {
    return `O Google recusou o uso do projeto indicado. Confirme que GOOGLE_CLOUD_PROJECT_ID (ou o project_id do JSON) é o projeto da conta de serviço.${suffix(info)}`;
  }

  if (/aiplatform\.endpoints\.predict/i.test(message) || reason === 'IAM_PERMISSION_DENIED') {
    return `A conta de serviço precisa do papel "Usuário da Plataforma de Agentes" (aiplatform.user, antigo "Vertex AI User") no projeto dela para usar o Gemini-TTS.${suffix(info)}`;
  }

  if (status === 401) {
    return `As credenciais da conta de serviço foram recusadas. Verifique GOOGLE_TTS_CREDENTIALS_JSON.${suffix(info)}`;
  }

  if (status === 401 || status === 403) {
    return `O Google recusou o pedido de narração: ${message || 'sem detalhe'}${suffix(info)}`;
  }

  if (status === 400) {
    if (/ssml/i.test(message)) {
      return `O texto enviado ao Google TTS contém SSML inválido.${suffix(info)}`;
    }
    return `Pedido inválido ao Google TTS: ${message || 'sem detalhe'}${suffix(info)}`;
  }

  if (status === 429) {
    return `Limite de uso do Google TTS excedido. Tente novamente mais tarde.${suffix(info)}`;
  }

  return `Google TTS respondeu com erro ${status}: ${message || 'sem detalhe'}`;
}
