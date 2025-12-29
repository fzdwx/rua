import invariant from "tiny-invariant";
import { Command } from "./Command.ts";
import type {
  Action,
  ActionStore,
  History,
  RecentUsageRecord,
  QueryAffinityRecord,
} from "../types.ts";
import { Priority } from "../utils.ts";
import { generateKeywords, generateKeywordVariations, getActionHistory } from "../search";

interface ActionImplOptions {
  store: ActionStore;
  ancestors?: ActionImpl[];
  history?: History;
}

/**
 * Extends the configured keywords to include the section and subtitle
 * This allows section names and subtitles to be searched for.
 */
const extendKeywords = (action: Action): string[] => {
  const additional: string[] = [];

  // Add section name
  if (action.section) {
    const sectionName = typeof action.section === "string" ? action.section : action.section.name;
    if (sectionName) {
      additional.push(...generateKeywordVariations(sectionName));
    }
  }

  // Add subtitle
  if (action.subtitle) {
    additional.push(...generateKeywordVariations(action.subtitle));
  }

  return additional;
};

export class ActionImpl implements Action {
  id: Action["id"];
  name: Action["name"];
  shortcut: Action["shortcut"];
  keywords?: string[]; // All keywords (auto-generated + user-defined)
  userKeywords?: Set<string>; // User-defined keywords only (for boost scoring)
  section: Action["section"];
  icon: Action["icon"];
  subtitle: Action["subtitle"];
  parent?: Action["parent"];
  item?: Action["item"];
  kind?: Action["kind"];
  query?: Action["query"];
  footerAction?: Action["footerAction"];

  // Usage tracking and ranking fields
  usageCount?: number;
  lastUsedTime?: number;
  recentUsage?: RecentUsageRecord[];
  queryAffinity?: Record<string, QueryAffinityRecord>;
  stableBias?: number;

  badge?: Action["badge"];
  disableSearchFocus?: Action["disableSearchFocus"];
  hideSearchBox?: Action["hideSearchBox"];
  uiEntry?: Action["uiEntry"];
  details?: Action["details"];
  /**
   * @deprecated use action.command.perform
   */
  perform: Action["perform"];
  priority: number = Priority.NORMAL;

  command?: Command;

  ancestors: ActionImpl[] = [];
  children: ActionImpl[] = [];

  constructor(action: Action, options: ActionImplOptions) {
    Object.assign(this, action);
    this.id = action.id;
    this.name = action.name;

    // Initialize user keywords set
    this.userKeywords = new Set<string>();

    // Add user-provided keywords to userKeywords set
    if (action.keywords) {
      if (typeof action.keywords === "string") {
        const keywordArray = action.keywords
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0);
        keywordArray.forEach((k) => this. userKeywords!.add(k));
      } else if (Array.isArray(action.keywords)) {
        action.keywords.forEach((k) => {
          const trimmed = k.trim().toLowerCase();
          if (trimmed) this.userKeywords!.add(trimmed);
        });
      }
    }

    // Add subtitle and section keywords to userKeywords
    const additionalKeywords = extendKeywords(action);
    additionalKeywords.forEach(kw => this.userKeywords!.add(kw));

    // Generate all keywords (including auto-generated ones)
    const baseKeywords = generateKeywords({
      name: action.name,
      keywords: action.keywords,
    });

    // Combine all keywords and ensure uniqueness
    this.keywords = [...new Set([...baseKeywords, ...additionalKeywords])];

    // Load history from localStorage
    const history = getActionHistory(action.id);
    if (history) {
      this.usageCount = history.usageCount;
      this.lastUsedTime = history.lastUsedTime;
      this.recentUsage = history.recentUsage;
      this.queryAffinity = history.queryAffinity;
      // Stable bias can be overridden in action definition
      this.stableBias = action.stableBias ?? history.stableBias;
    } else {
      // Initialize default values
      this.usageCount = action.usageCount || 0;
      this.lastUsedTime = action.lastUsedTime;
      this.recentUsage = action.recentUsage || [];
      this.queryAffinity = action.queryAffinity || {};
      this.stableBias = action.stableBias;
    }

    const perform = action.perform;
    this.command =
      perform &&
      new Command(
        {
          perform: () => perform(this),
        },
        {
          history: options.history,
        }
      );
    // Backwards compatibility
    this.perform = this.command?.perform;

    if (action.parent) {
      const parentActionImpl = options.store[action.parent];
      invariant(
        parentActionImpl,
        `attempted to create an action whos parent: ${action.parent} does not exist in the store.`
      );
      parentActionImpl.addChild(this);
    }
  }

  addChild(childActionImpl: ActionImpl) {
    // add all ancestors for the child action
    childActionImpl.ancestors.unshift(this);
    let parent = this.parentActionImpl;
    while (parent) {
      childActionImpl.ancestors.unshift(parent);
      parent = parent.parentActionImpl;
    }
    // we ensure that order of adding always goes
    // parent -> children, so no need to recurse
    this.children.push(childActionImpl);
  }

  removeChild(actionImpl: ActionImpl) {
    // recursively remove all children
    const index = this.children.indexOf(actionImpl);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    if (actionImpl.children) {
      actionImpl.children.forEach((child) => {
        this.removeChild(child);
      });
    }
  }

  // easily access parentActionImpl after creation
  get parentActionImpl() {
    return this.ancestors[this.ancestors.length - 1];
  }

  static create(action: Action, options: ActionImplOptions) {
    return new ActionImpl(action, options);
  }
}
