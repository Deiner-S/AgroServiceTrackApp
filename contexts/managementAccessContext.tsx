import { useAuth } from '@/contexts/authContext';
import { useSync } from '@/contexts/syncContext';
import { getErrorMessage } from '@/exceptions/ExceptionHandler';
import { hasWebAccess } from '@/services/networkService';
import type { AccessContext, DashboardModule, DashboardPayload } from '@/services/management';
import { buildRetryAfterSecondsMessage, CONTEXT_MESSAGES } from '@/contexts/messages';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ManagementAccessContextValue = {
  dashboard: DashboardPayload | null;
  access: AccessContext | null;
  modules: DashboardModule[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: (isRefresh?: boolean) => Promise<void>;
};

const ManagementAccessContext = createContext<ManagementAccessContextValue | null>(null);

type ManagementAccessProviderProps = {
  children: ReactNode;
};

function getThrottleMessage(error: unknown): string | null {
  const message = getErrorMessage(error);
  const match = message.match(/Expected available in (\d+) seconds?/i);

  if (!message.includes('HTTP 429')) {
    return null;
  }

  if (!match) {
    return CONTEXT_MESSAGES.tooManyRequests;
  }

  return buildRetryAfterSecondsMessage(match[1]);
}

export function ManagementAccessProvider({ children }: ManagementAccessProviderProps) {
  const { loged, session, revalidateSession } = useAuth();
  const { lastSyncAt } = useSync();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(session);
  const [loading, setLoading] = useState(!session);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<DashboardPayload | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const resetState = useCallback(() => {
    setDashboard(null);
    setLoading(false);
    setRefreshing(false);
    setError(null);
  }, []);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!loged) {
      resetState();
      return;
    }

    const currentSession = sessionRef.current;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(!currentSession);
      }

      setError(null);

      if (currentSession) {
        setDashboard(currentSession);
      }

      const online = await hasWebAccess().catch(() => false);
      if (!online) {
        if (!currentSession) {
          setError(CONTEXT_MESSAGES.offlineWithoutPermissions);
        }
        return;
      }

      const response = await revalidateSession();

      if (!response) {
        setDashboard(null);
        setError(CONTEXT_MESSAGES.sessionExpired);
        return;
      }

      setDashboard(response);
    } catch (error) {
      const throttleMessage = getThrottleMessage(error);

      if (throttleMessage) {
        setError(throttleMessage);
        return;
      }

      setError(CONTEXT_MESSAGES.permissionsRefreshUnavailable);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loged, revalidateSession, resetState]);

  useEffect(() => {
    if (!loged) {
      resetState();
      return;
    }

    if (session) {
      setDashboard(session);
      setLoading(false);
      setError(null);
      return;
    }

    void loadDashboard();
  }, [loged, loadDashboard, resetState, session]);

  useEffect(() => {
    if (!loged || !lastSyncAt) {
      return;
    }

    void loadDashboard(true);
  }, [lastSyncAt, loadDashboard, loged]);

  const value = useMemo<ManagementAccessContextValue>(() => ({
    dashboard,
    access: dashboard?.access ?? null,
    modules: dashboard?.modules ?? [],
    loading,
    refreshing,
    error,
    reload: loadDashboard,
  }), [dashboard, error, loadDashboard, loading, refreshing]);

  return (
    <ManagementAccessContext.Provider value={value}>
      {children}
    </ManagementAccessContext.Provider>
  );
}

export function useManagementAccess() {
  const context = useContext(ManagementAccessContext);

  if (!context) {
    throw new Error(CONTEXT_MESSAGES.useManagementAccessWithinProvider);
  }

  return context;
}
