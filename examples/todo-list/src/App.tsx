/**
 * todo-list - Todo List Extension
 * Demonstrates simplified command palette API with CRUD operations
 */
import { useState, useEffect, useMemo, useCallback, type RefObject } from "react";
import { initializeRuaAPI, type RuaAPI } from "rua-api/browser";
import { CommandPalette, createQuerySubmitHandler, type Action, PanelProps } from "@rua/ui";

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
}: {
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  inputRef?: RefObject<HTMLElement>;
}) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose submit function globally for footer to call
  useEffect(() => {
    (window as any).__createTodoSubmit = handleSubmit;
    (window as any).__createTodoCanSubmit = () => !!title.trim() && !isSubmitting;
    return () => {
      delete (window as any).__createTodoSubmit;
      delete (window as any).__createTodoCanSubmit;
    };
  }, [title, isSubmitting]);

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
            if (e.key === "Enter" && title.trim()) {
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
      // Quick create with query input
      {
        id: "create-todo",
        name: "Quick Create Todo",
        icon: "⚡",
        subtitle: "Press Tab to type title",
        section: "Actions",
        priority: 80,
        query: true,
      },
      // Create with panel (sub-page)
      {
        id: "create-todo-panel",
        name: "Create New Todo",
        icon: "➕",
        subtitle: "Open form to create todo",
        section: "Actions",
        priority: 99,
        panel: ({ onClose, afterPopoverFocusElement }: PanelProps) => {
          return (
            <CreateTodoPanel
              onClose={onClose}
              onSubmit={handleCreateTodo}
              inputRef={afterPopoverFocusElement}
            />
          );
        },
        panelTitle: "New Todo",
        panelFooterActions: (onClose: () => void) => [
          {
            id: "cancel",
            name: "Cancel",
            icon: "←",
            perform: onClose,
          },
          {
            id: "create",
            name: "Create",
            icon: "✓",
            perform: () => {
              const submit = (window as any).__createTodoSubmit;
              if (submit) submit();
            },
          },
        ],
      },
      ...todoActions,
    ];
  }, [todos, handleCreateTodo, rua]);

  return (
    <CommandPalette
      actions={actions}
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
