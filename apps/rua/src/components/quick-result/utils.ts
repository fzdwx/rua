import { isMathExpression } from "./Calculator";
import { isBuiltInFunction } from "./DateTimeDisplay";
import { isUtilityFunction } from "./UtilityDisplay";

/**
 * Get detailed information about what quick result content is available
 * This version caches all three checks and returns them together
 */
export function getQuickResultInfo(search: string) {
  if (!search.trim()) {
    return { hasContent: false, hasUtility: false, hasDateTime: false, hasMath: false };
  }

  const trimmedSearch = search.trim();
  const hasUtility = isUtilityFunction(trimmedSearch);
  const hasDateTime = isBuiltInFunction(trimmedSearch);
  const hasMath = isMathExpression(trimmedSearch);

  return {
    hasContent: hasUtility || hasDateTime || hasMath,
    hasUtility,
    hasDateTime,
    hasMath,
  };
}
