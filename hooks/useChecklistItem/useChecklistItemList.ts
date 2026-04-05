import { checklistItemService } from '@/services/checklistItem';
import type { ChecklistItemListItem } from '@/services/checklistItem';
import { useCallback, useEffect, useState } from 'react';

export default function useChecklistItemList() {
  const [items, setItems] = useState<ChecklistItemListItem[]>([]);
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
      const response = await checklistItemService.fetchChecklistItems(query);
      setItems(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar os dados.';
      setError(message);
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
