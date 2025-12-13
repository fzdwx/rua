import React from "react";
import {motion} from "motion/react";

interface AnimatedViewProps {
    viewKey: string;
    children: React.ReactNode;
}

// Animated view wrapper component
export const AnimatedView: React.FC<AnimatedViewProps> = ({viewKey, children}) => (
    <motion.div
        key={viewKey}
        initial={{opacity: 0, y: 8}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: -8}}
        transition={{duration: 0.2, ease: [0.4, 0, 0.2, 1]}}
        className="absolute inset-0 flex flex-col"
    >
        {children}
    </motion.div>
);

