import { Routes } from '@/app/routes';

export function getOperationalRoute(status: string): string {
  if (status === '2') {
    return Routes.MAINTENANCE;
  }

  if (status === '3') {
    return Routes.DELIVERY_CHECKLIST;
  }

  return Routes.CHECKLIST;
}
