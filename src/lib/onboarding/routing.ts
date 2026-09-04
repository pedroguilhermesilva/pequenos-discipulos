export const NEW_PROFILE_MODE_PARAM = 'novo';
export const NEW_PROFILE_MODE_QUERY = `?modo=${NEW_PROFILE_MODE_PARAM}`;

export function isNewProfileMode(
  searchParams: Pick<URLSearchParams, 'get'>
): boolean {
  return searchParams.get('modo') === NEW_PROFILE_MODE_PARAM;
}

export function withNewProfileMode(path: string, isNewProfile: boolean): string {
  return isNewProfile ? `${path}${NEW_PROFILE_MODE_QUERY}` : path;
}
