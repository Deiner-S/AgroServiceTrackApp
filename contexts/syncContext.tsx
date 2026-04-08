// sync/SyncContext.tsx
import { useAuth } from '@/contexts/authContext';
import { exceptionHandling, getErrorMessage } from '@/exceptions/ExceptionHandler';
import Synchronizer from '@/services/sync';
import { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';

type SyncProviderProps = {
  children: ReactNode;
};

type SyncContextValue = {
  runSync: () => Promise<boolean>;
  lastSyncAt: number | null;
};

export const SyncContext = createContext<SyncContextValue>({
  runSync: async () => false,
  lastSyncAt: null,
});

export function SyncProvider({ children }: SyncProviderProps) {
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const { logout } = useAuth();

  const runSync = async (): Promise<boolean> => {
    try {
      const synchronizer = await Synchronizer.build();
      await synchronizer.run();
      setLastSyncAt(Date.now());
      return true;
    } catch (error) {
      const message = getErrorMessage(error);

      if (message.includes('SESSION_EXPIRED')) {
        await logout();
        return false;
      }

      if (message.includes('MISSING_WEB_ACCESS')) {
        Alert.alert(
          'Sem conexao',
          'Este dispositivo nao possui acesso a internet no momento. Conecte-se a uma rede para sincronizar.'
        );
        return false;
      }

      await exceptionHandling(async () => {
        throw error;
      }, {
        operation: 'executar sincronizacao',
        rethrow: false,
      });

      return false;
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
