/**
 * todo-list - Todo List Extension
 * Demonstrates simplified command palette API with CRUD operations
 */
import { useState, useEffect, useMemo, useCallback, type RefObject } from "react";
import { initializeRuaAPI, type RuaAPI } from "rua-api/browser";
import { CommandPalette, createQuerySubmitHandler, type Action, type PanelRenderProps } from "@rua/ui";

// Simple Kbd component for keyboard shortcuts
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-[var(--gray4)] px-1 text-[10px] font-medium text-[var(--gray11)]">
      {children}
    </kbd>
  );
}

// Todo data structure
interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

// Format relative date (e.g., "2m ago", "5h ago", "3d ago")
function formatRelativeDate(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Create Todo Panel Component
function CreateTodoPanel({
  onClose,
  onSubmit,
  inputRef,
  setFooterRightElement,
}: {
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  inputRef?: RefObject<HTMLElement>;
  setFooterRightElement?: (element: React.ReactElement | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [title, isSubmitting, onSubmit, onClose]);

  // Handle Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && title.trim() && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [title, isSubmitting, handleSubmit]);

  // Set footer right element with create button
  useEffect(() => {
    if (setFooterRightElement) {
      setFooterRightElement(
        <div className="flex items-center gap-2 pr-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-[var(--blue9)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--blue10)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Create</span>
            <span className="flex items-center gap-0.5 opacity-70">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </span>
          </button>
        </div>
      );
    }

    return () => {
      if (setFooterRightElement) {
        setFooterRightElement(null);
      }
    };
  }, [setFooterRightElement, title, isSubmitting, handleSubmit]);

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold text-[var(--gray12)]">Create New Todo</h2>
      <div>
        <label htmlFor="todo-title" className="mb-2 block text-sm text-[var(--gray11)]">
          Title
        </label>
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && title.trim()) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Enter todo title..."
          autoFocus
          className="w-full rounded-md border border-[var(--gray6)] bg-[var(--gray2)] px-3 py-2 text-[var(--gray12)] placeholder-[var(--gray9)] focus:border-[var(--blue8)] focus:outline-none"
        />
      </div>
    </div>
  );
}

// Main App component
function App() {
  const [rua, setRua] = useState<RuaAPI | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeRuaAPI()
      .then(setRua)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-[var(--red11)]">
        <div className="mb-4 text-5xl">⚠️</div>
        <h3 className="mb-2">Error</h3>
        <p className="m-0 text-[var(--gray11)]">{error}</p>
      </div>
    );
  }

  if (!rua) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-[var(--gray11)]">
        Loading...
      </div>
    );
  }

  return <TodoCommandPalette rua={rua} />;
}

// Todo command palette component
function TodoCommandPalette({ rua }: { rua: RuaAPI }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  // ============================================================================
  // MANUAL NAVIGATION EXAMPLE (Optional)
  // ============================================================================
  // If you need custom navigation when a panel is open, manage state externally:
  //
  // const [customNavigation, setCustomNavigation] = useState<{
  //   title?: string;
  //   icon?: string;
  // } | null>(null);
  //
  // Then in your panel action, update the navigation when opening:
  //   panel: ({ onClose }) => {
  //     // Set custom navigation when panel opens
  //     useEffect(() => {
  //       setCustomNavigation({ title: "New Todo", icon: "➕" });
  //       return () => setCustomNavigation(null); // Reset on close
  //     }, []);
  //     return <CreateTodoPanel onClose={onClose} ... />;
  //   }
  //
  // And pass to CommandPalette:
  //   <CommandPalette
  //     navigationTitle={customNavigation?.title}
  //     navigationIcon={customNavigation?.icon}
  //     ...
  //   />
  //
  // By default, navigation uses manifest action info (title: "todo-list", icon: "./icon.png")
  // ============================================================================

  // Load todos from storage
  useEffect(() => {
    rua.storage
      .get<Todo[]>("todos")
      .then((data) => setTodos(data || []))
      .catch((err) => console.error("Failed to load todos:", err));
  }, [rua]);

  // Create todo handler - memoized to avoid recreating on every render
  const handleCreateTodo = useCallback(
    async (title: string) => {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title,
        done: false,
        createdAt: new Date().toISOString(),
      };
      setTodos((prev) => {
        const newTodos = [...prev, newTodo];
        rua.storage.set("todos", newTodos);
        return newTodos;
      });
    },
    [rua]
  );

  const defualtFootAction = [
      // Create with panel (sub-page)
      {
        id: "create-todo-panel",
        name: "Create New Todo",
        icon: "➕",
        priority: 99,
        panel: ({ onClose, afterPopoverFocusElement, setFooterRightElement }: PanelRenderProps) => {
          return (
            <CreateTodoPanel
              onClose={onClose}
              onSubmit={handleCreateTodo}
              inputRef={afterPopoverFocusElement}
              setFooterRightElement={setFooterRightElement}
            />
          );
        },
        // Note: panelTitle removed - navigation now comes from manifest action info
        // panelFooterActions simplified - main create button is now in rightElement
        panelFooterActions: (onClose: () => void) => [
          {
            id: "cancel",
            name: "Cancel",
            icon: "←",
            perform: onClose,
          },
        ],
      },
  ]

  // Build actions from todos
  const actions = useMemo<Action[]>(() => {
    const todoActions = todos.map(
      (todo): Action => ({
        id: `todo-${todo.id}`,
        name: todo.title,
        icon: todo.done ? "✅" : "⭕",
        subtitle: formatRelativeDate(todo.createdAt),
        section: todo.done ? "Completed" : "Active",
        priority: todo.done ? 0 : 10,
        badge: todo.done ? "Done" : undefined,
        item: todo,
        footerAction: (changeVisible: () => void): Action[] => [
          ...defualtFootAction,
          {
            id: `toggle-${todo.id}`,
            name: todo.done ? "Mark as Active" : "Mark as Done",
            icon: todo.done ? "⭕" : "✅",
            perform: async () => {
              const updated = todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t));
              await rua.storage.set("todos", updated);
              setTodos(updated);
              changeVisible();
            },
          },
          {
            id: `delete-${todo.id}`,
            name: "Delete",
            icon: "🗑️",
            perform: async () => {
              const updated = todos.filter((t) => t.id !== todo.id);
              await rua.storage.set("todos", updated);
              setTodos(updated);
              changeVisible();
            },
          },
        ],
      })
    );

    return [
      ...todoActions,
    ];
  }, [todos, handleCreateTodo, rua]);

  return (
    <CommandPalette
      actions={actions}
      loading={false}
      navigationLoading={true}
      rua={rua}
      placeholder="Search todo-list todos or create new..."
      onQuerySubmit={createQuerySubmitHandler("create-todo", handleCreateTodo)}
      emptyState={() => (
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 text-5xl">📝</div>
          <div className="text-sm text-[var(--gray11)]">No todos yet. Create your first one!</div>
        </div>
      )}
    />
  );
}

export default App;
