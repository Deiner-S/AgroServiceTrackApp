import CheckListItem from "@/models/CheckListItem";
import WorkOrder from "@/models/WorkOrder";
import { executeAsyncWithLayerException } from "@/exceptions/AppLayerException";
import SynchronizerServiceException from "@/exceptions/SynchronizerServiceException";
import CheckListItemRepository from "@/repository/CheckListItemRepository";
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { hasWebAccess, httpRequest } from "@/services/networkService";
import {getTokenStorange } from "@/storange/authStorange";
import { getErrorMessage } from "@/exceptions/AppLayerException";
import {
    buildChecklistApiPayload,
    buildWorkOrderApiPayload,
    validateCheckListItemApiResponse,
    validateChecklistApiEntries,
    validateOkResponse,
    validateWorkOrderApiEntries,
    validateWorkOrderApiResponse,
} from "@/utils/validation";


// tasks
// - polish exception handling
// - evaluate dividing the file into more specialized files
// - Add a retry system to requests.

export default class Synchronizer{
    private baseUrl: string
    private authToken: string
    
    private constructor() {
        this.baseUrl = "https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador"
        this.authToken = ""
    }

    static async build(): Promise<Synchronizer> {
        return executeAsyncWithLayerException(async () => {
            const instance = new Synchronizer();
            return instance;
        }, SynchronizerServiceException)
    }
    public async run(): Promise<void>{
        return executeAsyncWithLayerException(async () => {        
            if(!await hasWebAccess()) throw Error("MISSING_WEB_ACCESS")
                
            console.log("getToken")
            const authTokens = await getTokenStorange()
            if(authTokens?.access==null) throw Error("AUTH_TOKEN_MISSING") 
            this.authToken = authTokens.access
            console.log(this.authToken)
            
            console.log("sinc1")
            await this.receivePendingOrders("/send_work_orders_api/")
            console.log("sinc2")
            await this.receiveCheckListItems("/send_checklist_items_api/")
            console.log("sinc3")
            await this.sendWorkOrders("/receive_work_orders_api/")
            console.log("sinc4")
            await this.sendCheckListsFilleds("/receive_checklist_api/")
            
        }, SynchronizerServiceException, (err) => {
            console.log(`log Error: ${err}`)
            if (getErrorMessage(err).includes("SESSION_EXPIRED")) {
                return new SynchronizerServiceException("SESSION_EXPIRED", err)
            }
            return null
        })
        
    }

    private async receivePendingOrders(endPoint:string) {
        return executeAsyncWithLayerException(async () => {
            const workOrders = await httpRequest<WorkOrder[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })
            const validatedWorkOrders = validateWorkOrderApiResponse(workOrders)
            console.log(validatedWorkOrders)

            const workOrderRepository = await WorkOrderRepository.build()
            for(const workOrder of validatedWorkOrders){
                const order_exists = await workOrderRepository.getById(workOrder.operation_code)
                if(!order_exists){
                    workOrder.status_sync = 1
                    await workOrderRepository.save(workOrder)
                }
            }
        }, SynchronizerServiceException)
    }

    private async receiveCheckListItems(endPoint:string){
        return executeAsyncWithLayerException(async () => {
            const checklistItemList = await httpRequest<CheckListItem[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })
            const validatedChecklistItems = validateCheckListItemApiResponse(checklistItemList)

            const checkListItemRepository = await CheckListItemRepository.build();
            await checkListItemRepository.deleteAll()
            for(const item of validatedChecklistItems){
                await checkListItemRepository.save(item)
            }
        }, SynchronizerServiceException)
    }

    private async sendWorkOrders(endPoint:string){
        return executeAsyncWithLayerException(async () => {
            const workOrderRepository = await WorkOrderRepository.build()
            const workOrders = await workOrderRepository.getAll()
            const workOrdersFiltered = await workOrders.filter(item => item.status_sync !== 1)
            const validatedWorkOrders = validateWorkOrderApiEntries(workOrdersFiltered.map((item) => buildWorkOrderApiPayload(item)))

            if (validatedWorkOrders.length === 0){
                console.log(`throw Error: empyt list:${endPoint}`)

            }else{

                const response = await httpRequest<{ ok: boolean }>({
                    method: 'POST',
                    endpoint: endPoint,
                    BASE_URL: this.baseUrl,
                    body: validatedWorkOrders,
                    headers: {Authorization: `Bearer ${this.authToken}`,}
                })
                const validatedResponse = validateOkResponse(response)

                if(validatedResponse.ok){
                    for(const workOrder of validatedWorkOrders.map((entry) => workOrdersFiltered.find((item) => item.operation_code === entry.operation_code)!)){
                        workOrder.status_sync = 1
                        await workOrderRepository.update(workOrder)
                    }
                }else{
                    console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
                }
            }
        }, SynchronizerServiceException)
    }

    private async sendCheckListsFilleds(endPoint:string){
        return executeAsyncWithLayerException(async () => {
            const checkListRepository = await CheckListRepository.build()
            const checkLists = await checkListRepository.getAll()
            const checkListsFiltered = checkLists.filter(item => item.status_sync !== 1)
            const validatedChecklists = validateChecklistApiEntries(checkListsFiltered.map((item) => buildChecklistApiPayload(item)))

            if (validatedChecklists.length === 0){
                console.log(`throw Error: empyt list:${endPoint}`)
            }else{
                const response = await httpRequest<{ ok: boolean }>({
                        method: 'POST',
                        endpoint: endPoint,
                        BASE_URL: this.baseUrl,
                        body: validatedChecklists,
                        headers: {Authorization: `Bearer ${this.authToken}`,}
                })
                const validatedResponse = validateOkResponse(response)

                if(validatedResponse.ok){
                    for(const checkList of checkListsFiltered){
                        checkList.status_sync = 1
                        await checkListRepository.update(checkList)
                    }
                }else{
                    console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
                }
            }
        }, SynchronizerServiceException)
    }
}



 



    


