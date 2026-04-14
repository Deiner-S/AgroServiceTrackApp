import { exceptionHandling } from "@/exceptions/ExceptionHandler";
import WorkOrder from "@/models/WorkOrder";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { hasWebAccess } from "@/services/networkService";
import Synchronizer from "@/services/synchronizerService";
import { useEffect, useState } from "react";

/** Opcoes de status de ordem (alinhado ao backend). "all" = todos. */
export const WORK_ORDER_STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "1", label: "Pendente" },
  { value: "2", label: "Andamento" },
  { value: "3", label: "Entrega" },
] as const;

export default function useHomeHook() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("1");

  const loadWorkOrders = async () => {
    return exceptionHandling(async () => {
      const workOrderRepository = await WorkOrderRepository.build();
      const data: WorkOrder[] = await workOrderRepository.getAll();
      const visibleOrders = data.filter((order) => order.status !== "4");
      setWorkOrders(visibleOrders);
    }, {
      operation: "carregar ordens de servico",
    });
  };

  const syncWorkOrders = async () => {
    const canSync = await exceptionHandling(async () => {
      return hasWebAccess();
    }, {
      fallbackValue: false,
    });

    if (!canSync) {
      return false;
    }

    return exceptionHandling(async () => {
      const synchronizer = await Synchronizer.build();
      await synchronizer.run();
      await loadWorkOrders();
      return true;
    }, {
      operation: "sincronizar ordens de servico",
      fallbackValue: false,
    });
  };

  useEffect(() => {
    async function init() {
      await loadWorkOrders();
      await syncWorkOrders();
    }

    init();
  }, []);

  return {
    workOrders,
    selectedStatus,
    setSelectedStatus,
    reload: loadWorkOrders,
  };
}
