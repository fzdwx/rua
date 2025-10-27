import {Calculator, isMathExpression} from "./Calculator";
import {DateTimeDisplay, isBuiltInFunction} from "./DateTimeDisplay";

interface QuickResultProps {
    search: string;
}

/**
 * QuickResult component that displays calculator or date/time results
 * based on the input type
 */
export function QuickResult({search}: QuickResultProps) {
    if (!search.trim()) {
        return null;
    }

    const trimmedSearch = search.trim();

    // Check if it's a built-in function (date/time, uuid, etc.)
    if (isBuiltInFunction(trimmedSearch)) {
        return <DateTimeDisplay input={trimmedSearch}/>;
    }

    // Check if it's a math expression
    if (isMathExpression(trimmedSearch)) {
        return <Calculator expression={trimmedSearch}/>;
    }

    return null;
}
