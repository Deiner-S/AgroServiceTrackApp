export const Routes = {
  HOME: 'homeScreen',
  CHECKLIST: 'checklistScreen',
  DELIVERY_CHECKLIST: 'deliveryChecklistScreen',
  MAINTENANCE: 'maintenanceScreen',
  LOGIN: "/login"
} as const

export type RouteName = typeof Routes[keyof typeof Routes]
