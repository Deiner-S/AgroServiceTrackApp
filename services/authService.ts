import { AuthTokens, getTokenStorange, saveTokenStorange } from "@/storange/authStorange"
import AuthServiceException from "@/exceptions/AuthServiceException";
import { executeAsyncWithLayerException } from "@/exceptions/AppLayerException";
import { validateAuthTokensResponse, validateLoginPayload, validateRefreshTokenResponse } from "@/utils/validation";
import { httpRequest } from "./networkService"

type login = {
  username: string,
  password: string
}

export async function haveToken(): Promise<boolean> {
  return executeAsyncWithLayerException(async () => {
    const token = await getTokenStorange()
    return token?.access != null
  }, AuthServiceException)
}

export async function requestToken({ username, password }: login) {
  return executeAsyncWithLayerException(async () => {
    const credentials = validateLoginPayload({ username, password });

    const response = await httpRequest<AuthTokens>({
      method: 'POST',
      endpoint: '/api/token/',
      BASE_URL: "https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador",
      body: credentials
    })

    const validatedResponse = validateAuthTokensResponse(response);

    if (!validatedResponse.access && !validatedResponse.refresh) throw Error("REQUEST_FAILURE")

    console.log('REQUEST TOKEN:', validatedResponse.access)
    await saveTokenStorange({
      access: validatedResponse.access,
      refresh: validatedResponse.refresh
    })
  }, AuthServiceException, (err) => {
    const message = String(err)

    if (message.includes('no_active_account') || message.toLowerCase().includes('inativo')) {
      return new AuthServiceException('INACTIVE_USER', err)
    }

    if (message.includes('401')) {
      return new AuthServiceException('INVALID_CREDENTIALS', err)
    }

    return null
  })
}

export async function refreshToken(): Promise<string> {
  return executeAsyncWithLayerException(async () => {
    const tokens = await getTokenStorange()
    if (!tokens?.refresh) throw new Error('NO_REFRESH_TOKEN')

    const response = await httpRequest<{ access: string }>({
      method: 'POST',
      endpoint: '/api/token/refresh/',
      BASE_URL: 'https://ringless-equivalently-alijah.ngrok-free.dev/gerenciador',
      body: { refresh: tokens.refresh },
    })

    const validatedResponse = validateRefreshTokenResponse(response)

    if (!validatedResponse.access) throw new Error('REFRESH_FAILED')

    await saveTokenStorange({
      access: validatedResponse.access,
      refresh: tokens.refresh,
    })

    return validatedResponse.access
  }, AuthServiceException)
}
