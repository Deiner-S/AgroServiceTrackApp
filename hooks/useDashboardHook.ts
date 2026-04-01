import { fetchDashboard } from '@/services/managementService';
import type { DashboardPayload } from '@/types/management';
import { useCallback, useEffect, useState } from 'react';

export default function useDashboardHook() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
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
      const message = err instanceof Error ? err.message : 'Falha ao carregar o painel.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    refreshing,
    error,
    reload: loadDashboard,
  };
}
