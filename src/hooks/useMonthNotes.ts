import { useCallback, useEffect, useState } from 'react';
import {
  loadMonthNotes,
  saveMonthNotes,
  type MonthNotesMap,
} from '../lib/storage';
import {
  subscribeUserSettings,
  updateMonthNotesFirestore,
} from '../lib/firestore';

export function useMonthNotes(uid?: string) {
  const [notes, setNotes] = useState<MonthNotesMap>(() => loadMonthNotes());

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeUserSettings(uid, (settings) => {
        if (settings.monthNotes) {
          setNotes(settings.monthNotes);
          saveMonthNotes(settings.monthNotes);
        }
      });
      return unsubscribe;
    } else {
      setNotes(loadMonthNotes());
    }
  }, [uid]);

  const setNote = useCallback(
    async (monthKey: string, noteText: string) => {
      const trimmed = noteText.trim();
      const next = { ...notes };
      if (!trimmed) {
        delete next[monthKey];
      } else {
        next[monthKey] = trimmed;
      }
      setNotes(next);
      saveMonthNotes(next);

      if (uid) {
        await updateMonthNotesFirestore(uid, next);
      }
    },
    [notes, uid],
  );

  return { notes, setNote };
}
