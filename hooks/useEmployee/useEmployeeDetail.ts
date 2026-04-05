import { employeeService } from '@/services/employee';
import { executeControllerTask } from '@/services/core/controllerErrorService';
import type { EmployeeDetail } from '@/services/employee';
import { useCallback, useEffect, useState } from 'react';

export default function useEmployeeDetail(employeeId: string | undefined) {
  const [item, setItem] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingAddressId, setRemovingAddressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (isRefresh = false) => {
    if (!employeeId) {
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
      const response = await employeeService.fetchEmployeeDetail(employeeId);
      setItem(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar os dados.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId]);

  const toggleStatus = useCallback(async () => {
    if (!employeeId) {
      setError('Identificador invalido.');
      return false;
    }

    setActionLoading(true);

    try {
      const updated = await executeControllerTask(async () => {
        await employeeService.toggleEmployeeStatus(employeeId);
        await reload(true);
        return true;
      }, {
        operation: 'alterar status de funcionario',
        fallbackValue: false,
      });

      return Boolean(updated);
    } finally {
      setActionLoading(false);
    }
  }, [employeeId, reload]);

  const removeAddress = useCallback(async (addressId: string) => {
    if (!employeeId) {
      setError('Identificador invalido.');
      return false;
    }

    setRemovingAddressId(addressId);

    try {
      const updated = await executeControllerTask(async () => {
        const response = await employeeService.deleteEmployeeAddress(employeeId, addressId);
        setItem(response);
        return true;
      }, {
        operation: 'remover endereco de funcionario',
        fallbackValue: false,
      });

      return Boolean(updated);
    } finally {
      setRemovingAddressId(null);
    }
  }, [employeeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    item,
    loading,
    refreshing,
    actionLoading,
    removingAddressId,
    error,
    reload,
    setItem,
    toggleStatus,
    removeAddress,
  };
}
