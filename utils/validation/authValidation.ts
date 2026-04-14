import { rethrowAsValidationException } from '@/exceptions/ValidationException';
import { buildRequiredFieldMessage, VALIDATION_MESSAGES } from '@/utils/validation/messages';
import { validateAllowedKeys, validateObject, validateString } from '@/utils/validation/helpers';
import { validateOnlyLowercaseLetters } from '@/utils/validation/textValidation';

export function validateLoginPayload(payload: { username: string; password: string }) {
  return rethrowAsValidationException('user_input', () => {
    const username = validateOnlyLowercaseLetters(payload.username.trim());
    const password = validateString(payload.password, 'password').trim();

    if (!password.length) {
      throw new Error(buildRequiredFieldMessage('password'));
    }

    return {
      username,
      password,
    };
  });
}

export function validateAuthTokensResponse(value: unknown): { access: string; refresh: string } {
  return rethrowAsValidationException('api_contract', () => {
    const payload = validateObject(value, 'response');
    validateAllowedKeys(payload, ['access', 'refresh'], 'response');

    return {
      access: validateString(payload.access, 'access'),
      refresh: validateString(payload.refresh, 'refresh'),
    };
  });
}

export function validateRefreshTokenResponse(value: unknown): { access: string } {
  return rethrowAsValidationException('api_contract', () => {
    const payload = validateObject(value, 'response');
    validateAllowedKeys(payload, ['access'], 'response');

    return {
      access: validateString(payload.access, 'access'),
    };
  });
}

export function validateOkResponse(value: unknown): { ok: boolean } {
  return rethrowAsValidationException('api_contract', () => {
    const payload = validateObject(value, 'response');

    if (typeof payload.ok !== 'boolean') {
      throw new Error(VALIDATION_MESSAGES.responseOkMustBeBoolean);
    }

    return { ok: payload.ok };
  });
}
