import { fetchDashboard } from '@/services/management';
import type { DashboardPayload } from '@/services/management';
import {
  clearSessionStorange,
  getSessionStorange,
  saveSessionStorange,
} from '@/storange/sessionStorange';
import { validateDashboardResponse } from '@/utils/validation';

export const OFFLINE_SESSION_WINDOW_DAYS = 7;

export async function getStoredSessionSnapshot(): Promise<DashboardPayload | null> {
  const stored = await getSessionStorange();
  return stored ? validateDashboardResponse(stored) : null;
}

export async function saveSessionSnapshot(session: DashboardPayload): Promise<DashboardPayload> {
  const validatedSession = validateDashboardResponse(session);
  await saveSessionStorange(validatedSession);
  return validatedSession;
}

export async function clearSessionSnapshot(): Promise<void> {
  await clearSessionStorange();
}

export function isOfflineSessionActive(session: DashboardPayload, now = Date.now()): boolean {
  const expiresAt = Date.parse(session.session.offlineSessionExpiresAt);

  if (Number.isNaN(expiresAt)) {
    return false;
  }

  return expiresAt >= now;
}

export async function refreshSessionSnapshot(): Promise<DashboardPayload> {
  const dashboard = await fetchDashboard();
  return saveSessionSnapshot(dashboard);
}
