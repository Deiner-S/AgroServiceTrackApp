import { AuthTokens, getTokenStorange, saveTokenStorange } from "@/storange/authStorange"
import { httpRequest } from "./networkService"

type login = {
  username: string,
  password: string
}

export async function haveToken(): Promise<boolean> {
  try {
    const token = await getTokenStorange()
    return token?.access != null
  } catch (err) {
    throw err
  }
}

export async function requestToken({ username, password }: login) {
  try {
    const response = await httpRequest<AuthTokens>({
      method: 'POST',
      endpoint: '/api/token/',
      BASE_URL: "https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador",
      body: { username, password }
    })

    if (!response.access && !response.refresh) throw Error("REQUEST_FAILURE")

    console.log('REQUEST TOKEN:', response.access)
    await saveTokenStorange({
      access: response.access,
      refresh: response.refresh
    })
  } catch (err) {
    const message = String(err)

    if (message.includes('no_active_account') || message.toLowerCase().includes('inativo')) {
      throw new Error('INACTIVE_USER')
    }

    if (message.includes('401')) {
      throw new Error('INVALID_CREDENTIALS')
    }

    throw err
  }
}

export async function refreshToken(): Promise<void> {
  try {
    const tokens = await getTokenStorange()
    if (!tokens?.refresh) throw new Error('NO_REFRESH_TOKEN')

    const response = await httpRequest<{ access: string }>({
      method: 'POST',
      endpoint: '/api/token/refresh/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      body: { refresh: tokens.refresh },
    })

    if (!response.access) throw new Error('REFRESH_FAILED')

    await saveTokenStorange({
      access: response.access,
      refresh: tokens.refresh,
    })
  } catch (err) {
    throw err
  }
}
