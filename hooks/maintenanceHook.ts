import WorkOrder from "@/models/WorkOrder";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { validateServiceText } from "@/utils/validation";
import { useEffect, useState } from "react";

export default function useMaintenanceHook(workOrder: WorkOrder) {
  const [service, setService] = useState(workOrder.service ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setService(workOrder.service ?? "");
  }, [workOrder.operation_code, workOrder.service]);

  async function saveService() {
    setSaving(true);
    try {
      const repo = await WorkOrderRepository.build();
      const updated: WorkOrder = {
        ...workOrder,
        service: validateServiceText(service),
        status: "3",
        status_sync: 0,
      };
      await repo.update(updated);
    } finally {
      setSaving(false);
    }
  }

  return { service, setService, saveService, saving };
}
