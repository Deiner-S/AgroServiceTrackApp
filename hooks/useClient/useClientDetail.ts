import { clientService } from '@/services/client';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
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
      const response = await exceptionHandling(() => clientService.fetchClientDetail(clientId), {
        operation: 'carregar detalhes do cliente',
      });

      if (!response) {
        setError('Falha ao carregar cliente.');
        return;
      }

      setItem(response);
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
