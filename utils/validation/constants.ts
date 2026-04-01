export const ONLY_NUMBERS_PATTERN = /^\d+$/;
export const ONLY_LETTERS_PATTERN = /^[A-Za-zÀ-ÿ]+$/;
export const ONLY_LETTERS_AND_SPACES_PATTERN = /^[A-Za-zÀ-ÿ\s]+$/;
export const ONLY_LOWERCASE_LETTERS_PATTERN = /^[a-z]+$/;
export const LETTERS_AND_NUMBERS_PATTERN = /^[A-Za-zÀ-ÿ0-9]+$/;
export const LETTERS_NUMBERS_AND_SPACES_PATTERN = /^[A-Za-zÀ-ÿ0-9\s]+$/;
export const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const WORK_ORDER_REQUIRED_KEYS = [
  'operation_code',
  'chassi',
  'horimetro',
  'model',
  'date_in',
  'date_out',
  'status',
  'service',
];

export const CHECKLIST_REQUIRED_KEYS = [
  'checklist_item_fk',
  'work_order_fk',
  'status',
  'img_in',
  'img_out',
];

export const WORK_ORDER_ALLOWED_KEYS = [
  ...WORK_ORDER_REQUIRED_KEYS,
  'signature',
  'signature_in',
  'signature_out',
];

export const CHECKLIST_ALLOWED_KEYS = [...CHECKLIST_REQUIRED_KEYS, 'id'];

export const VALID_WORK_ORDER_STATUS = ['1', '2', '3', '4'] as const;
export const VALID_CHECKLIST_STATUS = ['1', '2', '3'] as const;
