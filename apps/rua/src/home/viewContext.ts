import React from "react";
import { ActionImpl } from "@/command";

// Context passed to view configs
export interface ViewContext {
  rootActionId: string | null;
  search: string;
  currentRootAction: ActionImpl | null;
  lastActiveMainAction: ActionImpl | null;
  handleActionLoadingChange: (loading: boolean) => void;
  setRootActionId: (id: string | null) => void;
  setSearch: (search: string) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  results: (string | ActionImpl)[];
  activeIndex: number;
  activeMainAction: ActionImpl | null;
  resultHandleEvent: boolean;
  theme: string;
  getFooterActions: (current: string | ActionImpl | null, changeVisible: () => void) => any[];
  getSettingsActions: () => any[];
  setActiveIndex: (index: number | ((prev: number) => number)) => void;
  setResultHandleEvent: (value: boolean) => void;
  onQueryActionEnter?: () => void;
  // Extension input visibility control
  extensionInputHidden?: boolean;
  setExtensionInputHidden?: (hidden: boolean) => void;
}
