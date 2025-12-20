import React, {useEffect, useRef} from "react"
import {useCommand} from "./useCommand"
import {Input} from "@/command"
import {ResultsRender} from "@/command"
import {Footer} from "@/command"
import type {CommandPaletteProps, UseCommandReturn} from "./types"
import {attemptFocusWithRetry} from "./utils"

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
    autoFocus = true,
    rightElement,
    emptyState,
    actions,
    rua,
    ...hookOptions
  } = props

  const command = useCommand({
    actions,
    ...hookOptions,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Store command in ref to avoid re-registering event listeners on every render
  const commandRef = useRef(command)
  useEffect(() => {
    commandRef.current = command
  }, [command])

  // Auto-focus input on mount when autoFocus is enabled
  useEffect(() => {
    if (!autoFocus) return

    // Focus immediately on mount
    const focusOnMount = async () => {
      await attemptFocusWithRetry(() => commandRef.current, {
        maxRetries: 5,
        initialDelay: 10,
        backoffMultiplier: 2,
      })
    }

    focusOnMount()
  }, [autoFocus])

  // Auto-focus input when extension is activated (for subsequent activations)
  useEffect(() => {
    if (!rua || !autoFocus) return

    const handleActivate = async () => {
      await attemptFocusWithRetry(() => commandRef.current, {
        maxRetries: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
      })
    }

    rua.on('activate', handleActivate)

    return () => {
      rua.off('activate', handleActivate)
    }
  }, [autoFocus, rua])

  // Handle ESC and Backspace for window hiding
  useEffect(() => {
    if (!rua) return // Only add listener if rua is provided

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle ESC and Backspace
      if (event.key !== "Escape" && event.key !== "Backspace") {
        return
      }

      // Check if we're at root level (no parent action)
      const isAtRoot = !command.rootActionId

      // Check if search is empty
      const isSearchEmpty = !command.search || command.search.trim() === ""

      // For ESC: hide window if at root with empty search
      if (event.key === "Escape" && isAtRoot && isSearchEmpty) {
        event.preventDefault()
        event.stopPropagation()
        rua.hideWindow().catch(err => {
          console.error("Failed to hide window:", err)
        })
        return
      }

      // For Backspace: hide window if at root with empty search
      // But only if the input element is focused and empty
      if (event.key === "Backspace" && isAtRoot && isSearchEmpty) {
        const target = event.target as HTMLElement
        // Check if the event is from an input and it's empty
        if (target.tagName === "INPUT" && (target as HTMLInputElement).value === "") {
          event.preventDefault()
          event.stopPropagation()
          rua.ui.close().catch(err => {
            console.error("Failed to hide window:", err)
          })
          return
        }
      }
    }

    // Use capture phase to intercept before Input component
    document.addEventListener("keydown", handleKeyDown, {capture: true})

    return () => {
      document.removeEventListener("keydown", handleKeyDown, {capture: true})
    }
  }, [rua, command.rootActionId, command.search])


  // Determine if we should show empty state
  const showEmptyState = command.results.length === 0 && !command.search && actions.length === 0

  return (
    <div
      ref={containerRef}
      className={`flex h-screen flex-col bg-[var(--app-bg)] ${className}`}
    >
      <Input {...command.inputProps} autoFocus={autoFocus} />

      <div className="flex-1 overflow-hidden">
        {showEmptyState && emptyState ? (
          <div
            className={`flex h-full flex-col items-center justify-center px-6 py-12 ${emptyStateClassName}`}
          >
            {emptyState({search: command.search, actions})}
          </div>
        ) : (
          <ResultsRender {...command.resultsProps} />
        )}
      </div>

      {showFooter && <Footer {...command.footerProps} rightElement={rightElement}/>}
    </div>
  )
}
