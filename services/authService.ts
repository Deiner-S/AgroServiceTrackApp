import { AuthTokens, getTokenStorange, saveTokenStorange } from "@/storange/authStorange"
import AuthServiceException from "@/exceptions/AuthServiceException";
import { exceptionHandling } from "@/exceptions/ExceptionHandler";
import { SERVICE_ERROR_CODES } from "@/services/messages";
import { validateAuthTokensResponse, validateLoginPayload, validateRefreshTokenResponse } from "@/utils/validation";
import { APP_API_BASE_URL, DEFAULT_REQUEST_TIMEOUT_MS } from "@/services/apiConfig";
import { httpRequest } from "@/services/networkService";

type login = {
  username: string,
  password: string
}

export async function haveToken(): Promise<boolean> {
  return exceptionHandling(async () => {
    const token = await getTokenStorange()
    return token?.access != null
  }, { ExceptionType: AuthServiceException })
}

export async function requestToken({ username, password }: login) {
  return exceptionHandling(async () => {
    const credentials = validateLoginPayload({ username, password });

    const response = await httpRequest<AuthTokens>({
      method: 'POST',
      endpoint: '/api/token/',
      BASE_URL: APP_API_BASE_URL,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
      body: credentials,
      skipAuthRefreshOnUnauthorized: true,
    })

    const validatedResponse = validateAuthTokensResponse(response);

    if (!validatedResponse.access && !validatedResponse.refresh) throw Error(SERVICE_ERROR_CODES.requestFailure)

    console.log('REQUEST TOKEN:', validatedResponse.access)
    await saveTokenStorange({
      access: validatedResponse.access,
      refresh: validatedResponse.refresh
    })
  }, { ExceptionType: AuthServiceException, mapError: (err) => {
    const message = String(err)

    if (message.includes('no_active_account') || message.toLowerCase().includes('inativo')) {
      return new AuthServiceException(SERVICE_ERROR_CODES.inactiveUser, err)
    }

    if (message.includes('401')) {
      return new AuthServiceException(SERVICE_ERROR_CODES.invalidCredentials, err)
    }

    return null
  } })
}

export async function refreshToken(): Promise<string> {
  return exceptionHandling(async () => {
    const tokens = await getTokenStorange()
    if (!tokens?.refresh) throw new Error(SERVICE_ERROR_CODES.noRefreshToken)

    const response = await httpRequest<{ access: string }>({
      method: 'POST',
      endpoint: '/api/token/refresh/',
      BASE_URL: APP_API_BASE_URL,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
      body: { refresh: tokens.refresh },
    })

    const validatedResponse = validateRefreshTokenResponse(response)

    if (!validatedResponse.access) throw new Error(SERVICE_ERROR_CODES.refreshFailed)

    await saveTokenStorange({
      access: validatedResponse.access,
      refresh: tokens.refresh,
    })

    return validatedResponse.access
  }, { ExceptionType: AuthServiceException })
}
