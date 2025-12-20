/**
 * todo-list - Todo List Extension
 * Demonstrates simplified command palette API with CRUD operations
 */
import { useState, useEffect, useMemo } from 'react'
import { initializeRuaAPI, type RuaAPI } from 'rua-api/browser'
import { CommandPalette, createQuerySubmitHandler, type Action } from '@rua/ui'

// Todo data structure
interface Todo {
  id: string
  title: string
  done: boolean
  createdAt: string
}

// Format relative date (e.g., "2m ago", "5h ago", "3d ago")
function formatRelativeDate(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Main App component
function App() {
  const [rua, setRua] = useState<RuaAPI | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeRuaAPI()
      .then(setRua)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-[var(--red11)]">
        <div className="mb-4 text-5xl">⚠️</div>
        <h3 className="mb-2">Error</h3>
        <p className="m-0 text-[var(--gray11)]">{error}</p>
      </div>
    )
  }

  if (!rua) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-[var(--gray11)]">
        Loading...
      </div>
    )
  }

  return <TodoCommandPalette rua={rua} />
}

// Todo command palette component
function TodoCommandPalette({ rua }: { rua: RuaAPI }) {
  const [todos, setTodos] = useState<Todo[]>([])

  // Load todos from storage
  useEffect(() => {
    rua.storage
      .get<Todo[]>("todos")
      .then((data) => setTodos(data || []))
      .catch((err) => console.error("Failed to load todos:", err))
  }, [rua])

  // Build actions from todos
  const actions = useMemo<Action[]>(() => {
    const todoActions = todos.map((todo) => ({
      id: `todo-${todo.id}`,
      name: todo.title,
      icon: todo.done ? "✅" : "⭕",
      subtitle: formatRelativeDate(todo.createdAt),
      section: todo.done ? "Completed" : "Active",
      priority: todo.done ? 0 : 10,
      badge: todo.done ? "Done" : undefined,
      item: todo,
      footerAction: (changeVisible: () => void) => [
        {
          id: `toggle-${todo.id}`,
          name: todo.done ? "Mark as Active" : "Mark as Done",
          icon: todo.done ? "⭕" : "✅",
          perform: async () => {
            const updated = todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))
            await rua.storage.set("todos", updated)
            setTodos(updated)
            changeVisible()
          },
        },
        {
          id: `delete-${todo.id}`,
          name: "Delete",
          icon: "🗑️",
          perform: async () => {
            const updated = todos.filter((t) => t.id !== todo.id)
            await rua.storage.set("todos", updated)
            setTodos(updated)
            changeVisible()
          },
        },
      ],
    }))

    return [
      {
        id: "create-todo",
        name: "Create New Todo",
        icon: "➕",
        subtitle: "Add a new task",
        section: "Actions",
        priority: 100,
        query: true,
      },
      ...todoActions,
    ]
  }, [todos])

  return (
    <CommandPalette
      actions={actions}
      rua={rua}
      placeholder="Search todo-list todos or create new..."
      onQuerySubmit={createQuerySubmitHandler("create-todo", async (query) => {
        const newTodo: Todo = {
          id: Date.now().toString(),
          title: query,
          done: false,
          createdAt: new Date().toISOString(),
        }
        const newTodos = [...todos, newTodo]
        await rua.storage.set("todos", newTodos)
        setTodos(newTodos)
      })}
      emptyState={() => (
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 text-5xl">📝</div>
          <div className="text-sm text-[var(--gray11)]">No todos yet. Create your first one!</div>
        </div>
      )}
    />
  )
}

export default App
