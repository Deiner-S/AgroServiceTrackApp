import { clientService } from '@/services/client';
import type { ClientDetail } from '@/services/client';
import { useCallback, useEffect, useState } from 'react';

export default function useClientDetail(clientId: string | undefined) {
  const [item, setItem] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (isRefresh = false) => {
    if (!clientId) {
      setError('Identificador invalido.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await clientService.fetchClientDetail(clientId);
      setItem(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar os dados.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    item,
    loading,
    refreshing,
    error,
    reload,
    setItem,
  };
}
