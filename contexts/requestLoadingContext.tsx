import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import {
  subscribeRequestLoading,
} from '@/services/requestLoadingService';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type RequestLoadingContextType = {
  isRequestLoading: boolean;
};

const RequestLoadingContext = createContext<RequestLoadingContextType>({
  isRequestLoading: false,
});

type RequestLoadingProviderProps = {
  children: ReactNode;
};

export function RequestLoadingProvider({ children }: RequestLoadingProviderProps) {
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  useEffect(() => {
    const subscription = exceptionHandling(async () => {
      return subscribeRequestLoading(setIsRequestLoading);
    }, {
      operation: 'inicializar monitor de carregamento',
      fallbackValue: () => undefined,
    });

    return () => {
      void subscription.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  return (
    <RequestLoadingContext.Provider value={{ isRequestLoading }}>
      {children}
    </RequestLoadingContext.Provider>
  );
}

export function useRequestLoading() {
  return useContext(RequestLoadingContext);
}
