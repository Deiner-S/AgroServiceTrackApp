import { clientService } from '@/services/client';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import type { ClientListItem } from '@/services/client';
import { useCallback, useEffect, useState } from 'react';

export default function useClientList() {
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (query = searchQuery, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await exceptionHandling(() => clientService.fetchClients(query), {
        operation: 'carregar lista de clientes',
      });

      if (!response) {
        setError('Falha ao carregar clientes.');
        return;
      }

      setItems(response);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      reload(searchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [reload, searchQuery]);

  return {
    items,
    searchQuery,
    setSearchQuery,
    loading,
    refreshing,
    error,
    reload,
  };
}
