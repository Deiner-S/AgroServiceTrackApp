export const Routes = {
  HOME: 'homeScreen',
  ORDERS: 'ordersScreen',
  CLIENTS: 'clientsScreen',
  CLIENT_DETAIL: 'clientDetailScreen',
  EMPLOYEES: 'employeesScreen',
  EMPLOYEE_DETAIL: 'employeeDetailScreen',
  CHECKLIST_ITEMS: 'checklistItemsScreen',
  CHECKLIST_ITEM_DETAIL: 'checklistItemDetailScreen',
  CHECKLIST: 'checklistScreen',
  DELIVERY_CHECKLIST: 'deliveryChecklistScreen',
  MAINTENANCE: 'maintenanceScreen',
  LOGIN: "/login"
} as const

export type RouteName = typeof Routes[keyof typeof Routes]
