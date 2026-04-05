import CheckListItem from "@/models/CheckListItem";
import WorkOrder from "@/models/WorkOrder";
import { exceptionHandling, getErrorMessage } from "@/exceptions/ExceptionHandler";
import SynchronizerServiceException from "@/exceptions/SynchronizerServiceException";
import CheckListItemRepository from "@/repository/CheckListItemRepository";
import CheckListRepository from '@/repository/CheckListRepository';
import ErrorLogRepository from "@/repository/ErrorLogRepository";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { APP_API_BASE_URL, SYNC_REQUEST_TIMEOUT_MS } from "@/services/core/apiConfig";
import { hasWebAccess, httpRequest } from "@/services/core/networkService";
import {getTokenStorange } from "@/storange/authStorange";
import {
    buildChecklistApiPayload,
    buildErrorLogApiPayload,
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
        this.baseUrl = APP_API_BASE_URL
        this.authToken = ""
    }

    static async build(): Promise<Synchronizer> {
        return exceptionHandling(async () => {
            const instance = new Synchronizer();
            return instance;
        }, { ExceptionType: SynchronizerServiceException })
    }
    public async run(): Promise<void>{
        return exceptionHandling(async () => {        
            if(!await hasWebAccess()) throw Error("MISSING_WEB_ACCESS")
                
            const authTokens = await getTokenStorange()
            if(authTokens?.access==null) throw Error("AUTH_TOKEN_MISSING") 
            this.authToken = authTokens.access
            await this.receivePendingOrders("/send_work_orders_api/")
            await this.receiveCheckListItems("/send_checklist_items_api/")
            await this.sendWorkOrders("/receive_work_orders_api/")
            await this.sendCheckListsFilleds("/receive_checklist_api/")
            await this.sendErrorLogs("/receive_mobile_logs_api/")
            
        }, { ExceptionType: SynchronizerServiceException, mapError: (err) => {
            if (getErrorMessage(err).includes("SESSION_EXPIRED")) {
                return new SynchronizerServiceException("SESSION_EXPIRED", err)
            }
            return null
        } })
        
    }

    private async receivePendingOrders(endPoint:string) {
        return exceptionHandling(async () => {
            const workOrders = await httpRequest<WorkOrder[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                timeoutMs: SYNC_REQUEST_TIMEOUT_MS,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })
            const validatedWorkOrders = validateWorkOrderApiResponse(workOrders)

            const workOrderRepository = await WorkOrderRepository.build()
            for(const workOrder of validatedWorkOrders){
                const order_exists = await workOrderRepository.getById(workOrder.operation_code)
                if(!order_exists){
                    workOrder.status_sync = 1
                    await workOrderRepository.save(workOrder)
                }
            }
        }, { ExceptionType: SynchronizerServiceException })
    }

    private async receiveCheckListItems(endPoint:string){
        return exceptionHandling(async () => {
            const checklistItemList = await httpRequest<CheckListItem[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                timeoutMs: SYNC_REQUEST_TIMEOUT_MS,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })
            const validatedChecklistItems = validateCheckListItemApiResponse(checklistItemList)

            const checkListItemRepository = await CheckListItemRepository.build();
            await checkListItemRepository.deleteAll()
            for(const item of validatedChecklistItems){
                await checkListItemRepository.save(item)
            }
        }, { ExceptionType: SynchronizerServiceException })
    }

    private async sendWorkOrders(endPoint:string){
        return exceptionHandling(async () => {
            const workOrderRepository = await WorkOrderRepository.build()
            const workOrders = await workOrderRepository.getAll()
            const workOrdersFiltered = await workOrders.filter(item => item.status_sync !== 1)
            const validatedWorkOrders = validateWorkOrderApiEntries(workOrdersFiltered.map((item) => buildWorkOrderApiPayload(item)))

            if (validatedWorkOrders.length === 0){
                return;

            }else{

                const response = await httpRequest<{ ok: boolean }>({
                    method: 'POST',
                    endpoint: endPoint,
                    BASE_URL: this.baseUrl,
                    timeoutMs: SYNC_REQUEST_TIMEOUT_MS,
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
                    throw new SynchronizerServiceException(`SYNC_ENDPOINT_FAILURE:${endPoint}`);
                }
            }
        }, { ExceptionType: SynchronizerServiceException })
    }

    private async sendCheckListsFilleds(endPoint:string){
        return exceptionHandling(async () => {
            const checkListRepository = await CheckListRepository.build()
            const checkLists = await checkListRepository.getAll()
            const checkListsFiltered = checkLists.filter(item => item.status_sync !== 1)
            const validatedChecklists = validateChecklistApiEntries(checkListsFiltered.map((item) => buildChecklistApiPayload(item)))

            if (validatedChecklists.length === 0){
                return;
            }else{
                const response = await httpRequest<{ ok: boolean }>({
                        method: 'POST',
                        endpoint: endPoint,
                        BASE_URL: this.baseUrl,
                        timeoutMs: SYNC_REQUEST_TIMEOUT_MS,
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
                    throw new SynchronizerServiceException(`SYNC_ENDPOINT_FAILURE:${endPoint}`);
                }
            }
        }, { ExceptionType: SynchronizerServiceException })
    }

    private async sendErrorLogs(endPoint:string){
        return exceptionHandling(async () => {
            const errorLogRepository = await ErrorLogRepository.build()
            const errorLogs = await errorLogRepository.getAll()
            const errorLogsFiltered = errorLogs.filter(item => item.status_sync !== 1)
            const validatedLogs = errorLogsFiltered.map((item) => buildErrorLogApiPayload(item))

            if (validatedLogs.length === 0){
                return;
            }else{
                const response = await httpRequest<{ ok: boolean }>({
                        method: 'POST',
                        endpoint: endPoint,
                        BASE_URL: this.baseUrl,
                        timeoutMs: SYNC_REQUEST_TIMEOUT_MS,
                        body: validatedLogs,
                        headers: {Authorization: `Bearer ${this.authToken}`,}
                })
                const validatedResponse = validateOkResponse(response)

                if(validatedResponse.ok){
                    for(const errorLog of errorLogsFiltered){
                        errorLog.status_sync = 1
                        await errorLogRepository.update(errorLog)
                    }
                }else{
                    throw new SynchronizerServiceException(`SYNC_ENDPOINT_FAILURE:${endPoint}`);
                }
            }
        }, { ExceptionType: SynchronizerServiceException })
    }
}



 



    


