export type AddressSummary = {
  id: string;
  label: string;
};

export type EmployeeDetailPermissions = {
  canToggleStatus: boolean;
  canEditEmployee: boolean;
  canManageAddresses: boolean;
};

export type EmployeePositionOption = {
  value: string;
  label: string;
};

export type EmployeeListItem = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  position: string;
  positionLabel: string;
  isActive: boolean;
  addressCount: number;
  insertDate?: string;
};

export type EmployeeDetail = EmployeeListItem & {
  firstName: string;
  lastName: string;
  addresses: AddressSummary[];
  permissions: EmployeeDetailPermissions;
  positionOptions: EmployeePositionOption[];
};

export type EmployeeUpdatePayload = {
  first_name: string;
  last_name: string;
  cpf: string;
  phone: string;
  email: string;
  position: string;
  username: string;
  password?: string;
};

export type EmployeeAddressPayload = {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zip_code: string;
};
