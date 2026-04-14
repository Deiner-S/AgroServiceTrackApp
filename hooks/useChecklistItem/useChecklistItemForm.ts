import { exceptionHandling } from '@/exceptions/ExceptionHandler';
import { checklistItemService } from '@/services/checklistItem';
import type { ChecklistItemCreatePayload, ChecklistItemDetail } from '@/services/checklistItem';
import { CHECKLIST_ITEM_HOOK_MESSAGES } from '@/hooks/useChecklistItem/messages';
import { validateChecklistItemNameField } from '@/utils/validation';
import { useCallback, useState } from 'react';

type ChecklistItemFormValues = ChecklistItemCreatePayload;
type ChecklistItemField = keyof ChecklistItemFormValues;
type ChecklistItemFormErrors = Partial<Record<ChecklistItemField, string>>;

const INITIAL_VALUES: ChecklistItemFormValues = {
  name: '',
};

function getFieldError(field: ChecklistItemField, value: string): string | undefined {
  try {
    switch (field) {
      case 'name':
        validateChecklistItemNameField(value);
        return undefined;
      default:
        return undefined;
    }
  } catch (error) {
    return error instanceof Error ? error.message : CHECKLIST_ITEM_HOOK_MESSAGES.invalidField;
  }
}

export default function useChecklistItemForm() {
  const [values, setValues] = useState<ChecklistItemFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ChecklistItemFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setFieldValue = useCallback((field: ChecklistItemField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: current[field] ? getFieldError(field, value) : undefined,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors: ChecklistItemFormErrors = {
      name: getFieldError('name', values.name),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }, [values.name]);

  const submit = useCallback(async (): Promise<ChecklistItemDetail | undefined> => {
    if (!validateForm()) {
      setFormError(CHECKLIST_ITEM_HOOK_MESSAGES.highlightFieldsBeforeContinue);
      return undefined;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload: ChecklistItemCreatePayload = {
        name: values.name,
      };

      const detail = await exceptionHandling(() => checklistItemService.createChecklistItem(payload), {
        operation: 'cadastrar item de checklist',
      });

      if (!detail) {
        setFormError(CHECKLIST_ITEM_HOOK_MESSAGES.failedSaveChecklistItem);
      }

      return detail;
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, values.name]);

  return {
    values,
    errors,
    submitting,
    formError,
    setFieldValue,
    submit,
  };
}
