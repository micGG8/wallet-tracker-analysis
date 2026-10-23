import { useCallback, useEffect, useState } from 'react';
import type { RuleWeights } from '../types';
import { loadRuleWeights, saveRuleWeights } from '../lib/storage';
import {
  subscribeUserSettings,
  updateRuleWeightsFirestore,
} from '../lib/firestore';

export function useRuleWeights(uid?: string) {
  const [weights, setWeights] = useState<RuleWeights>(() => loadRuleWeights());

  useEffect(() => {
    if (uid) {
      const unsubscribe = subscribeUserSettings(uid, (settings) => {
        if (settings.ruleWeights) {
          setWeights(settings.ruleWeights);
          saveRuleWeights(settings.ruleWeights);
        }
      });
      return unsubscribe;
    } else {
      setWeights(loadRuleWeights());
    }
  }, [uid]);

  const update = useCallback(
    async (next: RuleWeights) => {
      setWeights(next);
      saveRuleWeights(next);

      if (uid) {
        await updateRuleWeightsFirestore(uid, next);
      }
    },
    [uid],
  );

  return { weights, update };
}
