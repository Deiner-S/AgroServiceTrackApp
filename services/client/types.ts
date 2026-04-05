export type AddressSummary = {
  id: string;
  label: string;
};

export type ClientDetailPermissions = {
  canEditClient: boolean;
  canManageAddresses: boolean;
  canCreateServiceOrder: boolean;
  nextOperationCode?: string;
};

export type RelatedOrderSummary = {
  id: string;
  operationCode: string;
  status: string;
  statusLabel: string;
  insertDate?: string;
};

export type ClientListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  cnpj?: string;
  addressCount: number;
  insertDate?: string;
};

export type ClientDetail = ClientListItem & {
  addresses: AddressSummary[];
  recentOrders: RelatedOrderSummary[];
  permissions: ClientDetailPermissions;
};

export type ClientCreatePayload = {
  cnpj: string;
  name: string;
  email: string;
  phone: string;
};

export type ClientUpdatePayload = {
  name: string;
  email: string;
  phone: string;
};

export type ClientAddressPayload = {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zip_code: string;
};

export type ClientServiceOrderPayload = {
  operation_code: string;
  symptoms: string;
};
