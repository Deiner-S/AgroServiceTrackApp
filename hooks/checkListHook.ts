import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import CheckListItemReposytory from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import {
  buildChecklistPayload as buildChecklistPayloadService,
  ChecklistSavePayload,
  ChecklistStage,
  ChecklistStateItem,
  hydrateChecklistState as hydrateChecklistStateService,
  resolveChecklistDateChange,
  saveChecklistData,
  saveChecklistItems as saveChecklistItemsService,
  saveWorkOrderData as saveWorkOrderDataService,
} from '@/services/checklistService';
import { takePhoto as takePhotoService } from '@/services/imageService';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';

export { ChecklistSavePayload, ChecklistStage } from '@/services/checklistService';

export default function useCheckListHook() {
  const route = useRoute();
  const { workOrder } = route.params as { workOrder: WorkOrder };

  const [openSignature, setOpenSignature] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [dateFilled, setDateFilled] = useState(workOrder?.date_in ? new Date(workOrder.date_in) : new Date());
  const [openCalendar, setOpenCalendar] = useState(false);
  const [chassi, setChassi] = useState(workOrder?.chassi ?? '');
  const [horimetro, setHorimetro] = useState<number>(Number(workOrder?.horimetro) || 0);
  const [modelo, setModelo] = useState(workOrder?.model ?? '');

  const [checklistItems, setChecklistItems] = useState<CheckListItem[]>([]);
  const [checklistState, setChecklistState] = useState<ChecklistStateItem[]>([]);

  const [checkListRepositor, setCheckListRepository] = useState<CheckListRepository>();
  const [workOrderRepository, setWorkOrderRepository] = useState<WorkOrderRepository>();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const nextWorkOrderRepository = await WorkOrderRepository.build();
      const nextCheckListRepository = await CheckListRepository.build();
      const checkListItemRepository = await CheckListItemReposytory.build();

      if (!isMounted) return;

      setWorkOrderRepository(nextWorkOrderRepository);
      setCheckListRepository(nextCheckListRepository);

      const data = await checkListItemRepository.getAll();
      const filteredData = data.filter((item) => item.status !== 0);

      if (!isMounted) return;
      setChecklistItems(filteredData);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateChecklistState() {
      if (!checkListRepositor || checklistItems.length === 0) return;

      const hydratedState = await hydrateChecklistStateService(
        checkListRepositor,
        checklistItems,
        workOrder.operation_code
      );

      if (cancelled) return;

      setChecklistState(hydratedState);
    }

    hydrateChecklistState();

    return () => {
      cancelled = true;
    };
  }, [checkListRepositor, checklistItems, workOrder.operation_code]);

  function setItemSelected(id: string, value: string | null) {
    setChecklistState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: value } : item
      )
    );
  }

  function setItemPhotoInUri(id: string, uri: string) {
    setChecklistState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, photoInUri: uri, hasPhotoIn: true } : item
      )
    );
  }

  function setItemPhotoOutUri(id: string, uri: string) {
    setChecklistState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, photoOutUri: uri, hasPhotoOut: true } : item
      )
    );
  }

  const saveWorkOrderData = async (checklist: ChecklistSavePayload) => {
    if (!workOrderRepository) {
      throw new Error('WorkOrderRepository not initialized');
    }

    await saveWorkOrderDataService(workOrderRepository, checklist);
  };

  const saveChecklistItems = async (checklist: ChecklistSavePayload) => {
    if (!checkListRepositor) {
      throw new Error('CheckListRepository not initialized');
    }

    await saveChecklistItemsService(checkListRepositor, checklist);
  };

  const saveData = async (checklist: ChecklistSavePayload) => {
    if (!workOrderRepository) {
      throw new Error('WorkOrderRepository not initialized');
    }

    if (!checkListRepositor) {
      throw new Error('CheckListRepository not initialized');
    }

    await saveChecklistData(workOrderRepository, checkListRepositor, checklist);
  };

  const buildChecklistPayload = (
    stage: ChecklistStage,
    currentWorkOrder: WorkOrder = workOrder
  ): ChecklistSavePayload =>
    buildChecklistPayloadService({
      stage,
      workOrder: currentWorkOrder,
      checklistState,
      chassi,
      horimetro,
      modelo,
      dateFilled,
      signature,
    });

  function onChange(_event: unknown, selectedDate?: Date) {
    setOpenCalendar(false);
    const nextDate = resolveChecklistDateChange(selectedDate);

    if (nextDate) {
      setDateFilled(nextDate);
    }
  }

  const takePhoto = async (itemID: string, target: 'in' | 'out' = 'in') => {
    try {
      const uri = await takePhotoService();

      if (!uri) {
        return;
      }

      if (target === 'in') {
        setItemPhotoInUri(itemID, uri);
      } else {
        setItemPhotoOutUri(itemID, uri);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'CAMERA_PERMISSION_DENIED') {
        alert('Permita acesso à câmera.');
      }
    }
  };

  return {
    dateFilled,
    setDate: setDateFilled,
    openCalendar,
    setOpen: setOpenCalendar,
    chassi,
    setChassi,
    horimetro,
    setHorimetro,
    modelo,
    setModelo,
    checklistState,
    setChecklistState,
    setItemSelected,
    setItemPhotoInUri,
    setItemPhotoOutUri,
    workOrder,
    saveWorkOrderData,
    saveChecklistItems,
    saveData,
    buildChecklistPayload,
    onChange,
    takePhoto,
    checklistItems,
    signature,
    setSignature,
    setOpenSignature,
    openSignature,
  };
}
