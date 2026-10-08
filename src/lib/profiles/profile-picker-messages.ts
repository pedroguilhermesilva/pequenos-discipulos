export const PROFILE_SWITCH_ERROR =
  'Não foi possível trocar de perfil. Tente novamente.';

export function getProfileSwitchStatusLabel(name: string): string {
  return `Trocando para ${name}...`;
}
