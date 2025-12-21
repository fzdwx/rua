import { useState, useEffect, useMemo, useCallback } from "react";
import { initializeRuaAPI, type RuaAPI } from "rua-api/browser";
import {
  CommandPalette,
  createQuerySubmitHandler,
  useNavigation,
  Button,
  Kbd,
  type Action,
} from "@rua/ui";
import { useKeyPress } from "ahooks";

interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

function formatRelativeDate(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins + "m ago";
  if (diffHours < 24) return diffHours + "h ago";
  if (diffDays < 7) return diffDays + "d ago";
  return date.toLocaleDateString();
}

function CreateTodoPanel({ onSubmit }: { onSubmit: (title: string) => Promise<void> }) {
  const { pop, setAccessory, focusRef } = useNavigation();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      pop();
    } finally {
      setIsSubmitting(false);
    }
  }, [title, isSubmitting, onSubmit, pop]);

  useKeyPress("ctrl.enter", () => {
    if (title.trim() && !isSubmitting) {
      handleSubmit();
    }
  });

  useEffect(() => {
    setAccessory(
      <div onClick={handleSubmit} className="cursor-default command-subcommand-trigger">
        <span>Create</span>
        <Kbd>⌘</Kbd>
      +
      <Kbd>N</Kbd>
      </div>
    );
    return () => setAccessory(null);
  }, [setAccessory, title, isSubmitting, handleSubmit]);

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold text-[var(--gray12)]">Create New Todo</h2>
      <div>
        <label htmlFor="todo-title" className="mb-2 block text-sm text-[var(--gray11)]">
          Title
        </label>
        <input
          ref={focusRef as React.RefObject<HTMLInputElement>}
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter todo title..."
          autoFocus
          className="w-full rounded-md border border-[var(--gray6)] bg-[var(--gray2)] px-3 py-2 text-[var(--gray12)] placeholder-[var(--gray9)] focus:border-[var(--blue8)] focus:outline-none"
        />
      </div>
    </div>
  );
}

function MainAccessory({ onCreateTodo }: { onCreateTodo: (title: string) => Promise<void> }) {
  const { push } = useNavigation();

  const openCreatePanel = useCallback(() => {
    push({
      id: "create-todo",
      component: <CreateTodoPanel onSubmit={onCreateTodo} />,
      footerActions: (onClose: () => void) => [
        { id: "cancel", name: "Cancel", icon: "←", perform: onClose },
      ],
    });
  }, [push, onCreateTodo]);

  useKeyPress("ctrl.o", () => {
    openCreatePanel();
  });

  return (
    <div onClick={openCreatePanel} className="cursor-default command-subcommand-trigger">
      <span>New Todo</span>
      <Kbd>⌘</Kbd>
      +
      <Kbd>O</Kbd>
    </div>
  );
}

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

function TodoCommandPalette({ rua }: { rua: RuaAPI }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    rua.storage
      .get<Todo[]>("todos")
      .then((data) => setTodos(data || []))
      .catch((err) => console.error("Failed to load todos:", err));
  }, [rua]);

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

  const actions = useMemo<Action[]>(() => {
    return todos.map(
      (todo): Action => ({
        id: "todo-" + todo.id,
        name: todo.title,
        icon: todo.done ? "✅" : "⭕",
        subtitle: formatRelativeDate(todo.createdAt),
        section: todo.done ? "Completed" : "Active",
        priority: todo.done ? 0 : 10,
        badge: todo.done ? "Done" : undefined,
        item: todo,
        footerAction: (changeVisible: () => void): Action[] => [
          {
            id: "toggle-" + todo.id,
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
            id: "delete-" + todo.id,
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
  }, [todos, rua]);

  return (
    <CommandPalette
      actions={actions}
      loading={false}
      navigationLoading={false}
      rua={rua}
      placeholder="Search todos or create new..."
      accessory={<MainAccessory onCreateTodo={handleCreateTodo} />}
      emptyState={() => (
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 text-5xl">📝</div>
          <div className="text-sm text-[var(--gray11)]">
            No todos yet. Press Ctrl+O to create one!
          </div>
        </div>
      )}
    />
  );
}

export default App;
