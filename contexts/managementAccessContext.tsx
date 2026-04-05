import { useAuth } from '@/contexts/authContext';
import { useSync } from '@/contexts/syncContext';
import { fetchDashboard } from '@/services/management';
import type { AccessContext, DashboardModule, DashboardPayload } from '@/services/management';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

export function ManagementAccessProvider({ children }: ManagementAccessProviderProps) {
  const { loged } = useAuth();
  const { lastSyncAt } = useSync();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await fetchDashboard();
      setDashboard(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar permissoes do painel.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loged, resetState]);

  useEffect(() => {
    if (!loged) {
      resetState();
      return;
    }

    loadDashboard();
  }, [loged, loadDashboard, resetState]);

  useEffect(() => {
    if (!loged || !lastSyncAt) {
      return;
    }

    loadDashboard(true);
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
    throw new Error('useManagementAccess must be used within ManagementAccessProvider');
  }

  return context;
}
