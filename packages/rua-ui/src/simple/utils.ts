import type * as React from "react"
import type { Action, ActionId } from "../command/types"
import type { ActionImpl } from "../command"

/**
 * Safely get the active action, filtering out string types (section headers)
 *
 * @param results - Results array from useMatches
 * @param activeIndex - Current active index
 * @returns ActionImpl if valid, null otherwise
 *
 * @example
 * const activeAction = getActiveAction(results, state.activeIndex)
 * if (activeAction) {
 *   console.log(activeAction.name)
 * }
 */
export function getActiveAction(
  results: (ActionImpl | string)[],
  activeIndex: number
): ActionImpl | null {
  const activeItem = results[activeIndex]
  return activeItem && typeof activeItem !== "string" ? activeItem : null
}

/**
 * Create a query submit handler factory
 * Useful for common patterns like creating items
 *
 * @param actionId - The action ID to match
 * @param handler - Handler function to call when query is submitted
 * @returns Query submit callback
 *
 * @example
 * const handleSubmit = createQuerySubmitHandler(
 *   "create-todo",
 *   async (query) => {
 *     const newTodo = { id: Date.now().toString(), title: query, done: false }
 *     await createTodo(newTodo)
 *   }
 * )
 */
export function createQuerySubmitHandler(
  actionId: string,
  handler: (query: string) => void | Promise<void>
): (query: string, currentActionId: ActionId) => void | Promise<void> {
  return async (query: string, currentActionId: ActionId) => {
    if (currentActionId === actionId && query.trim()) {
      await handler(query.trim())
    }
  }
}

/**
 * Create a footer actions getter factory
 * Useful for providing context-aware footer actions based on item data
 *
 * NOTE: This function is designed to be used with the `footerActions` prop of `CommandPalette` or `useCommand`,
 * NOT as the `footerAction` property of individual Action objects.
 *
 * For individual actions, use a closure-based approach instead:
 * ```
 * footerAction: (changeVisible) => [
 *   { id: 'action', name: 'Action', perform: () => {...} }
 * ]
 * ```
 *
 * @param generator - Function that generates actions based on item data
 * @returns Footer actions getter function for use with CommandPalette footerActions prop
 *
 * @example
 * // Correct usage: As footerActions prop for CommandPalette
 * <CommandPalette
 *   actions={actions}
 *   footerActions={createFooterActionsGetter<Todo>((todo, changeVisible) => [
 *     {
 *       id: 'delete',
 *       name: 'Delete',
 *       icon: '🗑️',
 *       perform: async () => {
 *         await deleteTodo(todo.id)
 *         changeVisible()
 *       }
 *     }
 *   ])}
 * />
 */
export function createFooterActionsGetter<T = any>(
  generator: (item: T, changeVisible: () => void) => Action[]
): (current: ActionImpl | null, changeVisible: () => void) => Action[] {
  return (current: ActionImpl | null, changeVisible: () => void): Action[] => {
    if (!current || !current.item) return []
    return generator(current.item as T, changeVisible)
  }
}

/**
 * Create a footer content renderer
 * Provides sensible defaults with optional customization
 *
 * @param defaultContent - Default content when no action is selected
 * @param customRenderer - Optional custom renderer function
 * @returns Footer content renderer function
 *
 * @example
 * const footerContent = createFooterContentRenderer(
 *   "Select an action",
 *   (action) => `${action.name} - ${action.subtitle}`
 * )
 */
export function createFooterContentRenderer(
  defaultContent: string = "Select an action",
  customRenderer?: (current: ActionImpl) => string | React.ReactElement
): (current: ActionImpl | null) => string | React.ReactElement {
  return (current: ActionImpl | null) => {
    if (!current) return defaultContent
    if (customRenderer) return customRenderer(current)

    // Default behavior: show subtitle if available
    return current.subtitle || current.name
  }
}

/**
 * Merge user-provided actions with default properties
 * Ensures consistent action structure
 *
 * @param userActions - User-provided actions
 * @param defaults - Default properties to merge
 * @returns Actions with defaults applied
 *
 * @example
 * const actions = mergeActions(myActions, {
 *   priority: 10,
 *   section: "Actions"
 * })
 */
export function mergeActions(userActions: Action[], defaults: Partial<Action> = {}): Action[] {
  return userActions.map((action) => ({
    priority: 10,
    section: "Actions",
    ...defaults,
    ...action,
  }))
}
