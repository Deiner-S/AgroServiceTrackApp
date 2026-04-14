export const CONTEXT_MESSAGES = {
  loginFailed: 'Falha ao fazer login.',
  invalidCredentials: 'Credenciais invalidas.',
  inactiveUserOrInvalidCredentials: 'Usuario inativo ou credenciais invalidas.',
  offlineWithoutPermissions: 'Sem conexao para validar permissoes e nenhum perfil offline salvo.',
  sessionExpired: 'Sessao expirada. Faca login novamente.',
  permissionsRefreshUnavailable: 'Nao foi possivel atualizar as permissoes no momento.',
  tooManyRequests: 'Muitas requisicoes seguidas. Tente novamente em instantes.',
  syncRequiresInternet: 'Este dispositivo nao possui acesso a internet no momento. Conecte-se a uma rede para sincronizar.',
  useManagementAccessWithinProvider: 'useManagementAccess must be used within ManagementAccessProvider',
} as const;

export const CONTEXT_TITLES = {
  offline: 'Sem conexao',
} as const;

export function buildRetryAfterSecondsMessage(seconds: string | number): string {
  return `Muitas requisicoes seguidas. Tente novamente em ${seconds} segundos.`;
}
