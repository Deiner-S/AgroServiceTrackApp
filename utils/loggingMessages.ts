export const LOGGING_TITLES = {
  genericError: 'Erro',
} as const;

export function buildHighLevelOperationMessage(operation: string): string {
  return `Falha ao ${operation}. Tente novamente.`;
}
