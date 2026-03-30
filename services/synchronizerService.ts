import CheckListItem from "@/models/CheckListItem";
import WorkOrder from "@/models/WorkOrder";
import CheckListItemRepository from "@/repository/CheckListItemRepository";
import CheckListRepository from '@/repository/CheckListRepository';
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { hasWebAccess, httpRequest } from "@/services/networkService";
import {getTokenStorange } from "@/storange/authStorange";


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
        try {
            const instance = new Synchronizer();
            return instance;
        } catch (err) {
            throw err
        }
    }
    public async run(): Promise<void>{
        try{        
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
            
        }catch(err){
            console.log(`log Error: ${err}`)
            throw err
        }
        
    }

    private async receivePendingOrders(endPoint:string) {
        try {
            const workOrders = await httpRequest<WorkOrder[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })
            console.log(workOrders)
            if(!workOrders){
                console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
            }

            const workOrderRepository = await WorkOrderRepository.build()
            for(const workOrder of workOrders){
                const order_exists = await workOrderRepository.getById(workOrder.operation_code)
                if(!order_exists){
                    workOrder.status_sync = 1
                    await workOrderRepository.save(workOrder)
                }
            }
        } catch (err) {
            throw err
        }
    }

    private async receiveCheckListItems(endPoint:string){
        try {
            const checklistItemList = await httpRequest<CheckListItem[]>({
                method: 'GET',
                endpoint: endPoint,
                BASE_URL: this.baseUrl,
                headers: {Authorization: `Bearer ${this.authToken}`,}
            })

            if(!checklistItemList){
                console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
            }

            const checkListItemRepository = await CheckListItemRepository.build();
            await checkListItemRepository.deleteAll()
            for(const item of checklistItemList){
                await checkListItemRepository.save(item)
            }
        } catch (err) {
            throw err
        }
    }

    private async sendWorkOrders(endPoint:string){
        try {
            const workOrderRepository = await WorkOrderRepository.build()
            const workOrders = await workOrderRepository.getAll()
            const workOrdersFiltered = await workOrders.filter(item => item.status_sync !== 1)

            if (workOrdersFiltered.length === 0){
                console.log(`throw Error: empyt list:${endPoint}`)

            }else{

                const response = await httpRequest<{ ok: boolean }>({
                    method: 'POST',
                    endpoint: endPoint,
                    BASE_URL: this.baseUrl,
                    body: workOrdersFiltered,
                    headers: {Authorization: `Bearer ${this.authToken}`,}
                })

                if(response.ok){
                    for(const workOrder of workOrdersFiltered){
                        workOrder.status_sync = 1
                        await workOrderRepository.update(workOrder)
                    }
                }else{
                    console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
                }
            }
        } catch (err) {
            throw err
        }
    }

    private async sendCheckListsFilleds(endPoint:string){
        try {
            const checkListRepository = await CheckListRepository.build()
            const checkLists = await checkListRepository.getAll()
            const checkListsFiltered = checkLists.filter(item => item.status_sync !== 1)
            if (checkListsFiltered.length === 0){
                console.log(`throw Error: empyt list:${endPoint}`)
            }else{
                const response = await httpRequest<{ ok: boolean }>({
                        method: 'POST',
                        endpoint: endPoint,
                        BASE_URL: this.baseUrl,
                        body: checkListsFiltered,
                        headers: {Authorization: `Bearer ${this.authToken}`,}
                })

                if(response.ok){
                    for(const checkList of checkListsFiltered){
                        checkList.status_sync = 1
                        await checkListRepository.update(checkList)
                    }
                }else{
                    console.log(`throw Error: Failed to connect to endpoint:${endPoint}`)
                }
            }
        } catch (err) {
            throw err
        }
    }
}



 



    


