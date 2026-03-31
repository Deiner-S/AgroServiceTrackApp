import { executeControllerTask } from '@/services/controllerErrorService'
import { haveToken, requestToken } from '@/services/authService'
import { clearTokenStorange } from '@/storange/authStorange'
import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'

type props = {
  children: React.ReactNode
}

export function AuthProvider({ children }: props) {
  const [loged, setloged] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      await executeControllerTask(async () => {
        const containsToken = await haveToken()
        setloged(containsToken)
      }, {
        operation: 'validar autenticação',
      }).finally(() => {
        setLoading(false)
      })
    }

    bootstrap()
  }, [])

  async function login(username: string, password: string) {
    await executeControllerTask(async () => {
      await requestToken({ username, password })
      setloged(true)
    }, {
      operation: 'realizar login',
      user: username,
    })
  }

  function logout() {
    clearTokenStorange()
    setloged(false)
  }

  return (
    <AuthContext.Provider value={{ loged, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
