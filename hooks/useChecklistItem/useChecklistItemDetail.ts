import { executeControllerTask } from '@/services/core/controllerErrorService';
import { checklistItemService } from '@/services/checklistItem';
import type { ChecklistItemDetail } from '@/services/checklistItem';
import { useCallback, useEffect, useState } from 'react';

export default function useChecklistItemDetail(itemId: string | undefined) {
  const [item, setItem] = useState<ChecklistItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (isRefresh = false) => {
    if (!itemId) {
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
      const response = await checklistItemService.fetchChecklistItemDetail(itemId);
      setItem(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar os dados.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemId]);

  const toggleStatus = useCallback(async () => {
    if (!itemId) {
      setError('Identificador invalido.');
      return false;
    }

    setActionLoading(true);

    try {
      const updated = await executeControllerTask(async () => {
        await checklistItemService.toggleChecklistItemStatus(itemId);
        await reload(true);
        return true;
      }, {
        operation: 'alterar status de item de checklist',
        fallbackValue: false,
      });

      return Boolean(updated);
    } finally {
      setActionLoading(false);
    }
  }, [itemId, reload]);

  const deleteItem = useCallback(async () => {
    if (!itemId) {
      setError('Identificador invalido.');
      return false;
    }

    setDeleting(true);

    try {
      const removed = await executeControllerTask(async () => {
        const response = await checklistItemService.deleteChecklistItem(itemId);

        if (response) {
          setItem(null);
        }

        return response;
      }, {
        operation: 'excluir item de checklist',
        fallbackValue: false,
      });

      return Boolean(removed);
    } finally {
      setDeleting(false);
    }
  }, [itemId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    item,
    loading,
    refreshing,
    actionLoading,
    deleting,
    error,
    reload,
    setItem,
    toggleStatus,
    deleteItem,
  };
}
