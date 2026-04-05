import { checklistItemService } from '@/services/checklistItem';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
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
      const response = await exceptionHandling(() => checklistItemService.fetchChecklistItems(query), {
        operation: 'carregar lista de itens de checklist',
      });

      if (!response) {
        setError('Falha ao carregar itens de checklist.');
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
