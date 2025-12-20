import React from "react"
import { useCommand } from "./useCommand"
import { Input } from "../command/Input"
import { ResultsRender } from "../command/ResultsRender"
import { Footer } from "../command/Footer"
import type { CommandPaletteProps } from "./types"

/**
 * Pre-built command palette component with sensible defaults
 *
 * This component provides a complete command palette UI out of the box.
 * It automatically handles all state management internally using useCommand.
 *
 * @param props - CommandPalette configuration
 * @returns Complete command palette UI
 *
 * @example
 * <CommandPalette
 *   actions={todoActions}
 *   placeholder="Search todos..."
 *   onQuerySubmit={handleCreateTodo}
 *   emptyState={({ search }) => (
 *     <div>No results for "{search}"</div>
 *   )}
 * />
 */
export function CommandPalette(props: CommandPaletteProps) {
  const {
    className = "",
    emptyStateClassName = "",
    showFooter = true,
    rightElement,
    emptyState,
    actions,
    ...hookOptions
  } = props

  const command = useCommand({
    actions,
    ...hookOptions,
  })

  // Determine if we should show empty state
  const showEmptyState = command.results.length === 0 && !command.search && actions.length === 0

  return (
    <div className={`flex h-screen flex-col bg-[var(--app-bg)] ${className}`}>
      <Input {...command.inputProps} />

      <div className="flex-1 overflow-hidden">
        {showEmptyState && emptyState ? (
          <div
            className={`flex h-full flex-col items-center justify-center px-6 py-12 ${emptyStateClassName}`}
          >
            {emptyState({ search: command.search, actions })}
          </div>
        ) : (
          <ResultsRender {...command.resultsProps} />
        )}
      </div>

      {showFooter && <Footer {...command.footerProps} rightElement={rightElement} />}
    </div>
  )
}
