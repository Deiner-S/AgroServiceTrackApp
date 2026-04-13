import { requestToken } from '@/services/auth'
import {
  clearSessionSnapshot,
  getStoredSessionSnapshot,
  isOfflineSessionActive,
  refreshSessionSnapshot,
} from '@/services/auth/sessionService'
import { hasWebAccess } from '@/services/core/networkService'
import { exceptionHandling } from '@/exceptions/ExceptionHandler'
import type { DashboardPayload } from '@/services/management'
import { clearTokenStorange, getTokenStorange } from '@/storange/authStorange'
import NetInfo from '@react-native-community/netinfo'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContext'

type props = {
  children: ReactNode
}

export function AuthProvider({ children }: props) {
  const [loged, setloged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<DashboardPayload | null>(null)
  const revalidationInFlightRef = useRef<Promise<DashboardPayload | null> | null>(null)

  const clearPersistedAuthState = useCallback(async () => {
    await Promise.all([
      clearTokenStorange(),
      clearSessionSnapshot(),
    ])
    setSession(null)
    setloged(false)
  }, [])

  const revalidateSession = useCallback(async (): Promise<DashboardPayload | null> => {
    if (revalidationInFlightRef.current) {
      return revalidationInFlightRef.current
    }

    const revalidationPromise = (async (): Promise<DashboardPayload | null> => {
      const online = await hasWebAccess().catch(() => false)

      if (!online) {
        const storedSession = await getStoredSessionSnapshot()

        if (storedSession && isOfflineSessionActive(storedSession)) {
          setSession(storedSession)
          setloged(true)
          return storedSession
        }

        await clearPersistedAuthState()
        return null
      }

      try {
        const refreshedSession = await refreshSessionSnapshot()
        setSession(refreshedSession)
        setloged(true)
        return refreshedSession
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        if (message.includes('SESSION_EXPIRED') || message.includes('AUTH_TOKEN_MISSING')) {
          await clearPersistedAuthState()
          return null
        }

        throw error
      }
    })()

    revalidationInFlightRef.current = revalidationPromise

    try {
      return await revalidationPromise
    } finally {
      if (revalidationInFlightRef.current === revalidationPromise) {
        revalidationInFlightRef.current = null
      }
    }
  }, [clearPersistedAuthState])

  useEffect(() => {
    async function bootstrap() {
      await exceptionHandling(async () => {
        const storedSession = await getStoredSessionSnapshot()

        if (storedSession && isOfflineSessionActive(storedSession)) {
          setSession(storedSession)
          setloged(true)
          return
        }

        const tokens = await getTokenStorange()
        const online = await hasWebAccess().catch(() => false)

        if (tokens?.access && online) {
          await revalidateSession()
          return
        }

        await clearPersistedAuthState()
      }, {
        operation: 'validar autenticaÃ§Ã£o',
      }).finally(() => {
        setLoading(false)
      })
    }

    bootstrap()
  }, [clearPersistedAuthState, revalidateSession])

  useEffect(() => {
    let wasOnline = false

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable)

      if (!wasOnline && isOnline && loged) {
        void exceptionHandling(async () => {
          await revalidateSession()
        }, {
          operation: 'revalidar sessÃ£o ao reconectar',
        })
      }

      wasOnline = isOnline
    })

    return unsubscribe
  }, [loged, revalidateSession])

  async function login(username: string, password: string) {
    await exceptionHandling(async () => {
      await requestToken({ username, password })

      const refreshedSession = await revalidateSession()
      if (!refreshedSession) {
        throw new Error('SESSION_VALIDATION_FAILED')
      }
    }, {
      user: username,
      rethrow: true,
      mapError: (error) => {
        const message = String(error)

        if (message.includes('INVALID_CREDENTIALS')) {
          return new Error('Credenciais invalidas.')
        }

        if (message.includes('INACTIVE_USER')) {
          return new Error('Usuario inativo ou credenciais invalidas.')
        }

        if (message.includes('SESSION_VALIDATION_FAILED')) {
          return new Error('Falha ao fazer login.')
        }

        return new Error('Falha ao fazer login.')
      },
    })
  }

  async function logout() {
    await clearPersistedAuthState()
  }

  return (
    <AuthContext.Provider value={{ loged, loading, session, login, logout, revalidateSession }}>
      {children}
    </AuthContext.Provider>
  )
}
