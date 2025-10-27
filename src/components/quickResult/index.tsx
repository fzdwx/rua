import {Calculator, isMathExpression} from "./Calculator";
import {DateTimeDisplay, isBuiltInFunction} from "./DateTimeDisplay";
import {UtilityDisplay, isUtilityFunction} from "./UtilityDisplay";

interface QuickResultProps {
    search: string;
}

/**
 * QuickResult component that displays calculator, utility, or date/time results
 * based on the input type
 */
export function QuickResult({search}: QuickResultProps) {
    if (!search.trim()) {
        return null;
    }

    const trimmedSearch = search.trim();
    const comp = []
    // Check if it's a utility function (uuid, random, etc.)
    if (isUtilityFunction(trimmedSearch)) {
        comp.push(<UtilityDisplay input={trimmedSearch}/>)
    }

    // Check if it's a date/time function or expression
    if (isBuiltInFunction(trimmedSearch)) {
        comp.push(<DateTimeDisplay input={trimmedSearch}/>)
    }

    // Check if it's a math expression
    if (isMathExpression(trimmedSearch)) {
        comp.push(<Calculator expression={trimmedSearch}/>)
    }

    return <div>

    </div>;
}
