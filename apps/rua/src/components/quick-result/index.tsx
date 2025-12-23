import { Calculator } from "./Calculator";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { UtilityDisplay } from "./UtilityDisplay";

interface QuickResultProps {
  search: string;
  hasUtility?: boolean;
  hasDateTime?: boolean;
  hasMath?: boolean;
}

/**
 * QuickResult component that displays calculator, utility, or date/time results
 * based on the input type
 */
export function QuickResult({ search, hasUtility, hasDateTime, hasMath }: QuickResultProps) {
  const trimmedSearch = search.trim();

  if (!hasUtility && !hasDateTime && !hasMath) {
    return null;
  }

  const comp = [];

  if (hasUtility) {
    comp.push(<UtilityDisplay key="utility" input={trimmedSearch} />);
  }

  if (hasDateTime) {
    comp.push(<DateTimeDisplay key="datetime" input={trimmedSearch} />);
  }

  if (hasMath) {
    comp.push(<Calculator key="calculator" expression={trimmedSearch} />);
  }

  return (
    <div
      style={{
        height: "500px",
        position: "relative",
        overflow: "auto",
        width: "100%",
        minHeight: 0,
      }}
    >
      {comp}
    </div>
  );
}
