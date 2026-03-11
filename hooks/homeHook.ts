import WorkOrder from "@/models/WorkOrder";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import Synchronizer from "@/services/synchronizerService";
import { useEffect, useState } from "react";

/** Opções de status de ordem (alinhado ao backend). "all" = todos. */
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
    const workOrderRepository = await WorkOrderRepository.build();
    const data: WorkOrder[] = await workOrderRepository.getAll();
    const visibleOrders = data.filter((order) => order.status !== "4");
    setWorkOrders(visibleOrders);
  };

  useEffect(() => {
    async function init() {
      const synchronizer = await Synchronizer.build();
      await synchronizer.run();
      loadWorkOrders();
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