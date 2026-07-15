import { useCallback, useState } from 'react';

import { HealthEventKind } from '@/lib/healthEvents';

type UseHealthEventFormInput = {
  onSubmit: (kind: HealthEventKind, note: string) => Promise<void>;
};

export function useHealthEventForm({ onSubmit }: UseHealthEventFormInput) {
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<HealthEventKind>('Vomiting');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const submit = useCallback(async (): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      await onSubmit(kind, note);
      setNote('');
      setKind('Vomiting');
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, kind, note, onSubmit]);

  return { visible, kind, note, isSaving, open, close, setKind, setNote, submit };
}
