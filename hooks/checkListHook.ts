import CheckList from '@/models/CheckList';
import CheckListItem from '@/models/CheckListItem';
import WorkOrder from '@/models/WorkOrder';
import CheckListItemReposytory from '@/repository/CheckListItemRepository';
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from '@/repository/WorkOrderRepository';
import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from "react";

import { v4 as uuidv4 } from 'uuid';

interface ChecklistStateItem {
  id: string;
  selected: string | null;
  photoUri: string | null;
}

export type ChecklistType = "1" | "2";

export interface ChecklistWorkOrderUpdatePayload {
  chassi?: string;
  horimetro?: number;
  model?: string;
  date_in?: string;
  date_out?: string;
  status?: string;
  service?: string;
  signature_in?: string;
  signature_out?: string;
}

export interface ChecklistItemPayload {
  checklist_item_fk: string;
  status: string | null;
  photoUri: string | null;
}

export interface ChecklistSavePayload {
  type: ChecklistType;
  workOrder: WorkOrder;
  workOrderUpdate?: ChecklistWorkOrderUpdatePayload;
  items: ChecklistItemPayload[];
}

export default function useCheckListHook(){
  const route = useRoute();
  const { workOrder } = route.params as { workOrder: WorkOrder };

    const [openSignature, setOpenSignature] = useState(false);

    const [signature, setSignature] = useState<string>("")
    const [dateFilled, setDateFilled] = useState(workOrder?.date_in ? new Date(workOrder.date_in) : new Date());
    const [openCalendar, setOpenCalendar] = useState(false);
    const [chassi, setChassi] = useState(workOrder?.chassi ?? "");
    const [horimetro, setHorimetro] = useState<number>(Number(workOrder?.horimetro) || 0);
    const [modelo, setModelo] = useState(workOrder?.model ?? "");
    
    const [checklistItems, setChecklistItems] = useState<CheckListItem[]>([]);
    const [checklistState, setChecklistState] = useState<ChecklistStateItem[]>([]);
    
    const [checkListRepositor, setCheckListRepository] = useState<CheckListRepository>()
    const [workOrderRepository, setWorkOrderRepository] = useState<WorkOrderRepository>()
    useEffect(()=>{

        

    })

    useEffect(() => {
      
      let isMounted = true;
      
      async function init() {
        const workOrderRepository = await WorkOrderRepository.build();
        const checkListRepository = await CheckListRepository.build();
        const checkListItemRepository = await CheckListItemReposytory.build();

        if (!isMounted) return;

        setWorkOrderRepository(workOrderRepository);
        setCheckListRepository(checkListRepository);

        const data = await checkListItemRepository.getAll();
        const filteredData = data.filter(item => item.status !== 0);

        if (!isMounted) return;
        setChecklistItems(filteredData);
      }
      init();

      return () => {
        isMounted = false;
      };
    }, []);


    useEffect(() => {
      setChecklistState(
        checklistItems.map(item => ({
          id: item.id,
          selected: null,
          photoUri: null,
        }))
      );
    }, [checklistItems]);


    
    function setItemSelected(id: string, value: string | null) {
      setChecklistState(prev =>
        prev.map(item =>
          item.id === id ? { ...item, selected: value } : item
        )
      );
    }

    function setItemPhotoUri(id: string, uri: string) {
      setChecklistState(prev =>
        prev.map(item =>
          item.id === id ? { ...item, photoUri: uri } : item
        )
      );
    }
    function base64ToUint8Array(base64: string): Uint8Array {
      console.log("consegui ?")
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const binary = atob(cleanBase64);
      const len = binary.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }

    async function readImageAsUint8Array(uri: string): Promise<Uint8Array> {
          const response = await fetch(uri);
          const blob = await response.blob();

          return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
              const buffer = reader.result as ArrayBuffer;
              resolve(new Uint8Array(buffer));
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          });
        }

    const saveWorkOrderData = async (checklist: ChecklistSavePayload) => {
      if (!workOrderRepository) {
        throw new Error("WorkOrderRepository not initialized");
      }

      if (!checklist.workOrderUpdate) {
        return;
      }

      const {
        signature_in,
        signature_out,
        ...workOrderUpdate
      } = checklist.workOrderUpdate;

      await workOrderRepository.update({
        ...checklist.workOrder,
        ...workOrderUpdate,
        status_sync: 0,
        signature_in: signature_in
          ? await base64ToUint8Array(signature_in)
          : checklist.workOrder.signature_in,
        signature_out: signature_out
          ? await base64ToUint8Array(signature_out)
          : checklist.workOrder.signature_out,
      });
    };

    const saveChecklistItems = async (checklist: ChecklistSavePayload) => {
      if (!checkListRepositor) {
        throw new Error("CheckListRepository not initialized");
      }

      for (const item of checklist.items) {
        if (item.status && item.photoUri) {
          const novo_checklist: CheckList = {
            id: uuidv4(),
            checklist_item_fk: item.checklist_item_fk,
            work_order_fk: checklist.workOrder.operation_code,
            status_sync: 0,
            type: checklist.type,
            status: item.status,
            img: await readImageAsUint8Array(item.photoUri),
          };

          await checkListRepositor.save(novo_checklist);
        }
      }
    };

    const saveData = async (checklist: ChecklistSavePayload) => {
      await saveWorkOrderData(checklist);
      await saveChecklistItems(checklist);
    };

    const buildChecklistPayload = (
      type: ChecklistType,
      currentWorkOrder: WorkOrder = workOrder
    ): ChecklistSavePayload => ({
      type,
      workOrder: currentWorkOrder,
      workOrderUpdate: type === "1"
        ? {
            chassi,
            horimetro,
            model: modelo,
            date_in: dateFilled.toISOString(),
            status: "2",
            signature_in: signature,
          }
        : {
            date_out: new Date().toISOString(),
            status: "4",
            signature_out: signature,
          },
      items: checklistState.map((item) => ({
        checklist_item_fk: item.id,
        status: item.selected,
        photoUri: item.photoUri,
      })),
    });




  function onChange(_event: any, selectedDate?: Date) {
    setOpenCalendar(false);
    if (selectedDate) setDateFilled(selectedDate);
  }

  const takePhoto = async (itemID:string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) return alert("Permita acesso à câmera.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled)
      setItemPhotoUri(itemID, result.assets[0].uri);
  }
  //aqui precisamos fazer um readall do banco que contem o conjunto de checklist a serem feitos
  

  return{
    dateFilled, setDate: setDateFilled,openCalendar, setOpen: setOpenCalendar,
    chassi, setChassi,horimetro,setHorimetro,
    modelo, setModelo, checklistState, setChecklistState,
    setItemSelected, setItemPhotoUri, workOrder,
    saveWorkOrderData, saveChecklistItems,
    saveData,buildChecklistPayload,onChange,takePhoto, checklistItems,
    signature, setSignature,setOpenSignature,openSignature 
  }


}