import { useCallback, useEffect, useState } from 'react';

type DetailLoader<T> = (id: string) => Promise<T>;

export default function useManagementDetail<T>(identifier: string | undefined, loadData: DetailLoader<T>) {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (isRefresh = false) => {
    if (!identifier) {
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
      const response = await loadData(identifier);
      setItem(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar os dados.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [identifier, loadData]);

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
