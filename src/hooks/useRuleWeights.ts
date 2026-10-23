import { useCallback, useEffect, useState } from 'react';
import type { RuleWeights } from '../types';
import { DEFAULT_RULE_WEIGHTS } from '../types';
import { loadRuleWeights, saveRuleWeights } from '../lib/storage';

export function useRuleWeights() {
  const [weights, setWeights] = useState<RuleWeights>(DEFAULT_RULE_WEIGHTS);

  useEffect(() => {
    setWeights(loadRuleWeights());
  }, []);

  const update = useCallback((next: RuleWeights) => {
    setWeights(next);
    saveRuleWeights(next);
  }, []);

  return { weights, update };
}
