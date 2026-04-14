import { getTokenStorange } from '@/storange/authStorange';
import { SERVICE_ERROR_CODES } from '@/services/messages';

export async function getManagementAuthorizationHeaders() {
  const tokens = await getTokenStorange();

  if (!tokens?.access) {
    throw new Error(SERVICE_ERROR_CODES.authTokenMissing);
  }

  return {
    Authorization: `Bearer ${tokens.access}`,
  };
}

export function buildManagementQuery(searchQuery?: string): string {
  const normalizedQuery = searchQuery?.trim();

  if (!normalizedQuery) {
    return '';
  }

  return `?search=${encodeURIComponent(normalizedQuery)}`;
}
