import type WorkOrder from '@/models/WorkOrder';
import CheckListItem from '@/models/CheckListItem';
import CheckListItemReposytory from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import {
  buildChecklistPayload,
  hydrateChecklistState,
  resolveChecklistDateChange,
  saveChecklistData,
  type ChecklistSavePayload,
  type ChecklistStateItem,
} from '@/services/checklistFlow';
import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import { takePhoto as takePhotoService } from '@/services/core/imageService';
import { sanitizeOnlyNumbers } from '@/utils/validation';
import { useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type ChecklistCollectionErrors = {
  chassi?: string;
  horimetro?: string;
  modelo?: string;
  signature?: string;
  items: Record<string, string>;
};

export default function useChecklistCollection() {
  const route = useRoute();
  const { workOrder } = route.params as { workOrder: WorkOrder };
  const [loadedWorkOrder, setLoadedWorkOrder] = useState<WorkOrder | null>(workOrder ?? null);
  const [checklistItems, setChecklistItems] = useState<CheckListItem[]>([]);
  const [checklistState, setChecklistState] = useState<ChecklistStateItem[]>([]);
  const [checkListRepository, setCheckListRepository] = useState<CheckListRepository>();
  const [workOrderRepository, setWorkOrderRepository] = useState<WorkOrderRepository>();
  const [openSignature, setOpenSignature] = useState(false);
  const [signature, setSignature] = useState('');
  const [dateFilled, setDateFilled] = useState(workOrder?.date_in ? new Date(workOrder.date_in) : new Date());
  const [openCalendar, setOpenCalendar] = useState(false);
  const [chassi, setChassi] = useState(workOrder?.chassi ?? '');
  const [horimetro, setHorimetro] = useState<number>(Number(workOrder?.horimetro) || 0);
  const [horimetroInput, setHorimetroInput] = useState(workOrder?.horimetro ? String(workOrder.horimetro) : '');
  const [modelo, setModelo] = useState(workOrder?.model ?? '');
  const [formErrors, setFormErrors] = useState<ChecklistCollectionErrors>({ items: {} });

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
        const filteredData = data.filter((item) => item.status !== 0);

        if (isMounted) {
          setChecklistItems(filteredData);
        }
      }, {
        operation: 'carregar checklist de coleta',
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
        operation: 'carregar ordem de servico da coleta',
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [workOrder]);

  const displayOrder = loadedWorkOrder ?? workOrder;

  useEffect(() => {
    setDateFilled(displayOrder?.date_in ? new Date(displayOrder.date_in) : new Date());
    setChassi(displayOrder?.chassi ?? '');
    setHorimetro(Number(displayOrder?.horimetro) || 0);
    setHorimetroInput(displayOrder?.horimetro ? String(displayOrder.horimetro) : '');
    setModelo(displayOrder?.model ?? '');
  }, [displayOrder?.date_in, displayOrder?.chassi, displayOrder?.horimetro, displayOrder?.model]);

  useEffect(() => {
    let cancelled = false;

    async function loadChecklistState() {
      await exceptionHandling(async () => {
        if (!checkListRepository || checklistItems.length === 0) {
          return;
        }

        const hydratedState = await hydrateChecklistState(
          checkListRepository,
          checklistItems,
          displayOrder.operation_code
        );

        if (!cancelled) {
          setChecklistState(hydratedState);
        }
      }, {
        operation: 'carregar estado da coleta',
      });
    }

    loadChecklistState();

    return () => {
      cancelled = true;
    };
  }, [checkListRepository, checklistItems, displayOrder.operation_code]);

  const hasSignature = useMemo(() => !!signature, [signature]);

  function updateChassi(value: string) {
    setChassi(value);
    setFormErrors((current) => ({ ...current, chassi: undefined }));
  }

  function updateHorimetroInput(value: string) {
    const sanitized = sanitizeOnlyNumbers(value);
    setHorimetroInput(sanitized);
    setHorimetro(sanitized ? Number(sanitized) : 0);
    setFormErrors((current) => ({ ...current, horimetro: undefined }));
  }

  function updateModelo(value: string) {
    setModelo(value);
    setFormErrors((current) => ({ ...current, modelo: undefined }));
  }

  function updateSignature(value: string) {
    setSignature(value);
    setFormErrors((current) => ({ ...current, signature: undefined }));
  }

  function setItemSelected(id: string, value: string | null) {
    setChecklistState((prev) => prev.map((item) => (
      item.id === id ? { ...item, selected: value } : item
    )));

    if (!value) {
      return;
    }

    setFormErrors((current) => {
      const nextItems = { ...current.items };
      delete nextItems[id];

      return {
        ...current,
        items: nextItems,
      };
    });
  }

  function setItemPhotoInUri(id: string, uri: string) {
    setChecklistState((prev) => prev.map((item) => (
      item.id === id ? { ...item, photoInUri: uri, hasPhotoIn: true } : item
    )));
  }

  function onChange(_event: unknown, selectedDate?: Date) {
    setOpenCalendar(false);
    const nextDate = resolveChecklistDateChange(selectedDate);

    if (nextDate) {
      setDateFilled(nextDate);
    }
  }

  function validateBeforeSave(): boolean {
    const nextErrors: ChecklistCollectionErrors = { items: {} };

    if (!chassi.trim()) {
      nextErrors.chassi = 'Campo obrigatorio';
    }

    if (!horimetroInput.trim()) {
      nextErrors.horimetro = 'Campo obrigatorio';
    }

    if (!modelo.trim()) {
      nextErrors.modelo = 'Campo obrigatorio';
    }

    for (const item of checklistState) {
      if (!item.selected) {
        nextErrors.items[item.id] = 'Campo obrigatorio';
      }
    }

    if (!signature.trim()) {
      nextErrors.signature = 'Campo obrigatorio';
    }

    setFormErrors(nextErrors);

    return !nextErrors.chassi
      && !nextErrors.horimetro
      && !nextErrors.modelo
      && !nextErrors.signature
      && Object.keys(nextErrors.items).length === 0;
  }

  async function saveChecklist(): Promise<ChecklistSavePayload | undefined> {
    if (!validateBeforeSave()) {
      return undefined;
    }

    return exceptionHandling(async () => {
      if (!workOrderRepository || !checkListRepository) {
        throw new Error('Repositorios do checklist nao inicializados.');
      }

      const payload = buildChecklistPayload({
        stage: 'collection',
        workOrder: displayOrder,
        checklistState,
        chassi,
        horimetro,
        modelo,
        dateFilled,
        signature,
      });

      await saveChecklistData(workOrderRepository, checkListRepository, payload);
      return payload;
    }, {
      operation: 'salvar checklist de coleta',
    });
  }

  async function takePhoto(itemId: string) {
    const uri = await exceptionHandling(async () => {
      const nextUri = await takePhotoService();
      return nextUri ?? null;
    }, {
      operation: 'capturar foto da coleta',
    });

    if (uri) {
      setItemPhotoInUri(itemId, uri);
    }
  }

  return {
    workOrder,
    displayOrder,
    checklistItems,
    checklistState,
    chassi,
    horimetroInput,
    modelo,
    dateFilled,
    openCalendar,
    openSignature,
    signature,
    hasSignature,
    formErrors,
    setChassi: updateChassi,
    setHorimetroInput: updateHorimetroInput,
    setModelo: updateModelo,
    setOpenCalendar,
    setOpenSignature,
    setSignature: updateSignature,
    setItemSelected,
    onChange,
    takePhoto,
    saveChecklist,
  };
}
