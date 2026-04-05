import { rethrowAsValidationException } from "@/exceptions/ValidationException";
import WorkOrder from "@/models/WorkOrder";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { sanitizeOnlyLettersNumbersAndSpaces, validateServiceText } from "@/utils/validation";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";

export default function useChecklistMaintenance() {
  const route = useRoute();
  const { workOrder: workOrderParam } = (route.params ?? {}) as { workOrder?: WorkOrder };
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(workOrderParam ?? null);
  const [service, setService] = useState(workOrderParam?.service ?? "");
  const [saving, setSaving] = useState(false);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [serviceDraft, setServiceDraft] = useState("");
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    setWorkOrder(workOrderParam ?? null);
  }, [workOrderParam]);

  useEffect(() => {
    if (!workOrderParam?.operation_code) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const repo = await WorkOrderRepository.build();
        const loaded = await repo.getById(workOrderParam.operation_code);
        if (!cancelled && loaded) {
          setWorkOrder(loaded);
        }
      } catch (_) {
        if (!cancelled && workOrderParam) {
          setWorkOrder(workOrderParam);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workOrderParam]);

  const displayOrder = workOrder ?? workOrderParam ?? null;

  useEffect(() => {
    setService(displayOrder?.service ?? "");
  }, [displayOrder?.operation_code, displayOrder?.service]);

  useEffect(() => {
    if (!serviceEditorOpen) {
      setServiceDraft(service);
    }
  }, [service, serviceEditorOpen]);

  function openServiceEditor() {
    setServiceDraft(service);
    setServiceEditorOpen(true);
  }

  function closeServiceEditor() {
    setServiceEditorOpen(false);
  }

  function updateServiceDraft(value: string) {
    setServiceDraft(sanitizeOnlyLettersNumbersAndSpaces(value));
    setServiceError(null);
  }

  function applyServiceEditor() {
    setService(serviceDraft);
    setServiceError(serviceDraft.trim() ? null : serviceError);
    setServiceEditorOpen(false);
  }

  function validateBeforeSave() {
    if (!service.trim()) {
      setServiceError("Campo obrigatorio");
      return false;
    }

    setServiceError(null);
    return true;
  }

  async function saveService() {
    if (!displayOrder) {
      throw new Error("Ordem de servico nao informada.");
    }

    if (!validateBeforeSave()) {
      return false;
    }

    setSaving(true);
    try {
      const repo = await WorkOrderRepository.build();
      const updated: WorkOrder = {
        ...displayOrder,
        service: rethrowAsValidationException("user_input", () => validateServiceText(service)),
        status: "3",
        status_sync: 0,
      };
      await repo.update(updated);
      setWorkOrder(updated);
      return true;
    } finally {
      setSaving(false);
    }
  }

  return {
    workOrderParam,
    displayOrder,
    service,
    saving,
    serviceError,
    serviceEditorOpen,
    serviceDraft,
    setService,
    saveService,
    openServiceEditor,
    closeServiceEditor,
    updateServiceDraft,
    applyServiceEditor,
    validateBeforeSave,
  };
}
