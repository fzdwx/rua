import React from "react";
import { ActionImpl } from "./action";
import { ActionId } from "./types.ts";
import { Kbd } from "../components/ui/kbd.tsx";
import { motion } from "motion/react";

const RenderItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId,
      // @ts-ignore
      style,
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
      style?: React.CSSProperties;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    const ancestors = React.useMemo(() => {
      if (!currentRootActionId) return action.ancestors;
      const index = action.ancestors.findIndex(
        (ancestor: any) => ancestor.id === currentRootActionId
      );
      // +1 removes the currentRootAction; e.g.
      // if we are on the "Set theme" parent action,
      // the UI should not display "Set theme… > Dark"
      // but rather just "Dark"
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    return (
      <motion.div
        ref={ref}
        className={active ? "command-item-active" : "command-item"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex gap-2 items-center text-sm">
          {action.icon && action.icon}
          <div className="flex flex-col">
            <div>
              {ancestors?.length > 0 &&
                ancestors.map((ancestor: any) => (
                  <React.Fragment key={ancestor.id}>
                    <span className="opacity-50 mr-2">{ancestor.name}</span>
                    <span className="mr-2">&rsaquo;</span>
                  </React.Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className="text-[9px]" style={{ color: "var(--gray11)" }}>
                {action.subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Badge for action type */}
          {action.badge && (
            <span
              className="text-[12px] px-2 py-0.5 rounded whitespace-nowrap"
              style={{
                color: "var(--gray11)",
              }}
            >
              {action.badge}
            </span>
          )}
          {/* Shortcut keys */}
          {action.shortcut?.length ? (
            <div className="grid grid-flow-col gap-1" aria-hidden>
              {action.shortcut.map((sc: any) => (
                <Kbd
                  key={sc}
                  className="px-1.5 py-1 rounded text-sm"
                  style={{ background: "var(--hover2)" }}
                >
                  {sc}
                </Kbd>
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    );
  }
);

export { RenderItem };
