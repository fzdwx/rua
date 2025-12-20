import React, {useEffect, useRef} from "react"
import {useCommand} from "./useCommand"
import {Input} from "@/command"
import {ResultsRender} from "@/command"
import {Footer} from "@/command"
import type {CommandPaletteProps, UseCommandReturn} from "./types"

function autoFocusInput(command: UseCommandReturn) {
  useEffect(() => {
    let listener = () => {
      console.log("command palette activated - focusing input aaaaaaaaaaaaaaaaa")
      command.focusInput()
    };
    window.addEventListener('rua-extension-activate', listener)
    return () => {
      window.removeEventListener('rua-extension-activate', listener)
    }
  }, [])
}

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

  console.log("props.autoFocus:",props.autoFocus)
  if (props.autoFocus) {
    autoFocusInput(command);
  }

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
      <Input {...command.inputProps} />

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
