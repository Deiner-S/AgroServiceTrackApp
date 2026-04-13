export const Routes = {
  HOME: 'homeScreen',
  ORDERS: 'ordersScreen',
  CLIENTS: 'clients/clientsScreen',
  CLIENT_CREATE: 'clients/clientCreateScreen',
  CLIENT_DETAIL: 'clients/clientDetailScreen',
  CLIENT_EDIT: 'clients/clientEditScreen',
  CLIENT_ADDRESS_CREATE: 'clients/clientAddressCreateScreen',
  CLIENT_SERVICE_CREATE: 'clients/clientServiceCreateScreen',
  EMPLOYEES: 'employees/employeesScreen',
  EMPLOYEE_CREATE: 'employees/employeeCreateScreen',
  EMPLOYEE_DETAIL: 'employees/employeeDetailScreen',
  EMPLOYEE_EDIT: 'employees/employeeEditScreen',
  EMPLOYEE_ADDRESS_CREATE: 'employees/employeeAddressCreateScreen',
  CHECKLIST_ITEMS: 'checklistItems/checklistItemsScreen',
  CHECKLIST_ITEM_CREATE: 'checklistItems/checklistItemCreateScreen',
  CHECKLIST_ITEM_DETAIL: 'checklistItems/checklistItemDetailScreen',
  CHECKLIST_COLLECTION: 'checklistFlow/checklistCollectionScreen',
  CHECKLIST_MAINTENANCE: 'checklistFlow/checklistMaintenanceScreen',
  CHECKLIST_DELIVERY: 'checklistFlow/checklistDeliveryScreen',
  LOGIN: '/login',
} as const

export type RouteName = typeof Routes[keyof typeof Routes]
