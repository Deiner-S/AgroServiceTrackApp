import type WorkOrder from '@/models/WorkOrder';
import CheckListItem from '@/models/CheckListItem';
import CheckListItemReposytory from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import {
  buildChecklistPayload,
  hydrateDeliveryChecklistState,
  saveChecklistData,
  type ChecklistSavePayload,
  type ChecklistStateItem,
} from '@/services/checklistFlow';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import { takePhoto as takePhotoService } from '@/services/core/imageService';
import { parseWorkOrderParam } from '@/utils/orderNavigation';
import { useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type ChecklistDeliveryErrors = {
  signature?: string;
};

export default function useChecklistDelivery() {
  const route = useRoute();
  const { workOrderJson } = (route.params ?? {}) as { workOrderJson?: string | string[] };
  const workOrder = useMemo(() => parseWorkOrderParam(workOrderJson), [workOrderJson]);
  const [loadedWorkOrder, setLoadedWorkOrder] = useState<WorkOrder | null>(workOrder ?? null);
  const [availableChecklistItems, setAvailableChecklistItems] = useState<CheckListItem[]>([]);
  const [deliveryChecklistItems, setDeliveryChecklistItems] = useState<CheckListItem[]>([]);
  const [checklistState, setChecklistState] = useState<ChecklistStateItem[]>([]);
  const [checkListRepository, setCheckListRepository] = useState<CheckListRepository>();
  const [workOrderRepository, setWorkOrderRepository] = useState<WorkOrderRepository>();
  const [openSignature, setOpenSignature] = useState(false);
  const [signature, setSignature] = useState('');
  const [formErrors, setFormErrors] = useState<ChecklistDeliveryErrors>({});

  useEffect(() => {
    setLoadedWorkOrder(workOrder ?? null);
  }, [workOrder]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await exceptionHandling(async () => {
        const nextWorkOrderRepository = await WorkOrderRepository.build();
        const nextCheckListRepository = await CheckListRepository.build();
        const checkListItemRepository = await CheckListItemReposytory.build();

        if (!isMounted) {
          return;
        }

        setWorkOrderRepository(nextWorkOrderRepository);
        setCheckListRepository(nextCheckListRepository);

        const data = await checkListItemRepository.getAll();
        if (isMounted) {
          setAvailableChecklistItems(data);
        }
      }, {
        operation: 'carregar checklist de entrega',
      });
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!workOrder?.operation_code) {
      return;
    }

    let cancelled = false;

    (async () => {
      await exceptionHandling(async () => {
        const repo = await WorkOrderRepository.build();
        const loaded = await repo.getById(workOrder.operation_code);

        if (!cancelled && loaded) {
          setLoadedWorkOrder(loaded);
        }
      }, {
        operation: 'carregar ordem de servico da entrega',
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [workOrder]);

  const displayOrder = loadedWorkOrder ?? workOrder;

  useEffect(() => {
    let cancelled = false;

    async function loadChecklistState() {
      await exceptionHandling(async () => {
        if (!checkListRepository || availableChecklistItems.length === 0) {
          return;
        }

        if (!displayOrder?.operation_code) {
          return;
        }

        const hydratedState = await hydrateDeliveryChecklistState(
          checkListRepository,
          availableChecklistItems,
          displayOrder.operation_code
        );

        if (!cancelled) {
          setChecklistState(hydratedState.map(({ name: _name, ...state }) => state));
          setDeliveryChecklistItems(
            hydratedState.map((item) => ({
              id: item.id,
              name: item.name,
              status: 1,
            }))
          );
        }
  }, {
        operation: 'carregar estado da entrega',
      });
    }

    loadChecklistState();

    return () => {
      cancelled = true;
    };
  }, [availableChecklistItems, checkListRepository, displayOrder?.operation_code]);

  const hasSignature = useMemo(() => !!signature, [signature]);

  function updateSignature(value: string) {
    setSignature(value);
    setFormErrors({});
  }

  function setItemPhotoOutUri(id: string, uri: string) {
    setChecklistState((prev) => prev.map((item) => (
      item.id === id ? { ...item, photoOutUri: uri, hasPhotoOut: true } : item
    )));
  }

  function validateBeforeSave(): boolean {
    if (!signature.trim()) {
      setFormErrors({ signature: 'Campo obrigatorio' });
      return false;
    }

    setFormErrors({});
    return true;
  }

  async function saveChecklist(): Promise<ChecklistSavePayload | undefined> {
    if (!validateBeforeSave()) {
      return undefined;
    }

    return exceptionHandling(async () => {
      if (!displayOrder || !workOrderRepository || !checkListRepository) {
        throw new Error('Repositorios do checklist nao inicializados.');
      }

      const payload = buildChecklistPayload({
        stage: 'delivery',
        workOrder: displayOrder,
        checklistState,
        chassi: displayOrder.chassi ?? '',
        horimetro: Number(displayOrder.horimetro) || 0,
        modelo: displayOrder.model ?? '',
        dateFilled: new Date(),
        signature,
      });

      await saveChecklistData(workOrderRepository, checkListRepository, payload);
      return payload;
    }, {
      operation: 'salvar checklist de entrega',
    });
  }

  async function takePhoto(itemId: string) {
    const uri = await exceptionHandling(async () => {
      const nextUri = await takePhotoService();
      return nextUri ?? null;
    }, {
      operation: 'capturar foto da entrega',
    });

    if (uri) {
      setItemPhotoOutUri(itemId, uri);
    }
  }

  return {
    displayOrder,
    checklistState,
    deliveryChecklistItems,
    openSignature,
    signature,
    hasSignature,
    formErrors,
    setOpenSignature,
    setSignature: updateSignature,
    takePhoto,
    saveChecklist,
  };
}
