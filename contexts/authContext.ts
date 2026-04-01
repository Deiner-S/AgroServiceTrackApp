import { createContext, useContext } from 'react'

export type AuthContextType = {
  loged:boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
)

export function useAuth() {
  return useContext(AuthContext)
}
