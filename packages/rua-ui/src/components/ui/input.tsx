import * as React from "react";

import { cn } from "../../lib/utils.ts";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "text-(--gray12) bg-background border-muted-foreground/30 focus-visible:border-muted-foreground/50 focus-visible:ring-muted-foreground/10 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors file:h-7 file:text-sm file:font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] file:text-foreground placeholder:text-muted-foreground placeholder:font-normal w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
