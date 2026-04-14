export const VALIDATION_MESSAGES = {
  responseOkMustBeBoolean: 'response.ok deve ser booleano.',
  invalidStage: 'stage invalido.',
  invalidStateSelection: 'Selecione um estado valido.',
  invalidPositionSelection: 'Selecione um cargo valido.',
  invalidCnpj: 'CNPJ invalido. Use o formato XX.XXX.XXX/XXXX-XX.',
  invalidEmail: 'E-mail invalido. Use o formato nome@dominio.com ou nome@dominio.com.br.',
  invalidPhone: 'Telefone invalido. Use o formato (YY) XXXXX-XXXX ou (YY) XXXX-XXXX.',
  invalidZipCode: 'CEP invalido. Use o formato XXXXX-XXX.',
  invalidCpf: 'CPF invalido. Use o formato XXX.XXX.XXX-YY.',
  lowercaseLettersOnly: 'O valor deve conter somente letras minusculas, sem espacos.',
  lettersAndNumbersOnly: 'O valor deve conter somente letras e numeros.',
  invalidChassi: 'chassi invalido. Ele deve conter 17 caracteres, sem espacos e sem tracos.',
  invalidHorimetro: 'horimetro deve ser um numero valido.',
  invalidStatusSync: 'status_sync deve ser 0 ou 1.',
  invalidConnectionStatus: 'connectionStatus deve ser online, offline ou unknown.',
  workOrdersResponseMustBeList: 'A resposta de ordens de servico deve ser uma lista.',
  checklistItemsResponseMustBeList: 'A resposta de itens de checklist deve ser uma lista.',
  invalidWorkOrderEntity: 'WorkOrder invalida.',
} as const;

export function buildRequiredFieldMessage(fieldName: string): string {
  return `${fieldName} e obrigatorio.`;
}

export function buildOnlyLettersMessage(fieldName: string): string {
  return `${fieldName} deve conter somente letras.`;
}

export function buildOnlyNumbersMessage(fieldName: string): string {
  return `${fieldName} deve conter somente numeros.`;
}

export function buildBooleanFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser booleano.`;
}

export function buildNumericFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser numerico.`;
}

export function buildListFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser uma lista.`;
}

export function buildOnlyLettersAndSpacesMessage(fieldName: string): string {
  return `${fieldName} deve conter somente letras e espacos.`;
}

export function buildOnlyLettersNumbersAndSpacesMessage(fieldName: string): string {
  return `${fieldName} deve conter somente letras, numeros e espacos.`;
}

export function buildJsonObjectMessage(label: string): string {
  return `${label} deve ser um objeto JSON.`;
}

export function buildTextFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser um texto.`;
}

export function buildBinaryFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser um binario valido.`;
}

export function buildIsoDateFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser uma data valida em formato ISO.`;
}

export function buildUuidFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser um UUID valido.`;
}

export function buildIntegerFieldMessage(fieldName: string): string {
  return `${fieldName} deve ser um numero inteiro.`;
}

export function buildAllowedValuesMessage(fieldName: string, values: readonly (string | number)[]): string {
  return `${fieldName} invalido. Valores permitidos: ${values.join(', ')}.`;
}

export function buildMissingRequiredKeysMessage(label: string, missingKeys: string[]): string {
  return `${label} sem chaves obrigatorias: ${missingKeys.join(', ')}.`;
}

export function buildUnexpectedKeysMessage(label: string, unexpectedKeys: string[]): string {
  return `${label} contem chaves nao esperadas: ${unexpectedKeys.join(', ')}.`;
}
