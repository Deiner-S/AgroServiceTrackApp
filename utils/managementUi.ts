const STATUS_COLORS: Record<string, string> = {
  '1': '#f59e0b',
  '2': '#22c55e',
  '3': '#38bdf8',
  '4': '#94a3b8',
};

export function formatDateLabel(value?: string): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

export function getStatusColor(status: string | number): string {
  return STATUS_COLORS[String(status)] ?? '#2563eb';
}

export function getBooleanLabel(value: boolean, trueLabel: string, falseLabel: string): string {
  return value ? trueLabel : falseLabel;
}
