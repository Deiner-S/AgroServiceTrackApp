// sync/SyncContext.tsx
import { getErrorMessage } from '@/exceptions/AppLayerException';
import { useAuth } from '@/contexts/authContext';
import { executeControllerTask } from '@/services/controllerErrorService';
import Synchronizer from '@/services/synchronizerService';
import { createContext, ReactNode, useContext, useState } from 'react';

// children se refere a qualquer componente react vÃ¡lido
type SyncProviderProps = {
  children: ReactNode;
};
export const SyncContext = createContext<any>(null);

export function SyncProvider({ children }: SyncProviderProps) {
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const { logout } = useAuth();

  const runSync = async () => {
    try {
      const synchronizer = await Synchronizer.build();
      await synchronizer.run();
      setLastSyncAt(Date.now());
    } catch (error) {
      if (getErrorMessage(error).includes('SESSION_EXPIRED')) {
        await logout();
        return;
      }

      await executeControllerTask(async () => {
        throw error;
      }, {
        operation: 'executar sincronizaÃ§Ã£o',
        rethrow: true,
      });
    }
  };

  return (
    <SyncContext.Provider value={{ runSync, lastSyncAt }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
