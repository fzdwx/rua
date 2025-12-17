import { useState, useEffect } from 'react'
import { initializeRuaAPI, type RuaAPI } from 'rua-api/browser'
import { List, Form, NavigationProvider, useNavigation } from '@rua/ui'
import type { ListItem } from '@rua/ui'

interface Todo {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
  createdAt: string
}

function App() {
  const [rua, setRua] = useState<RuaAPI | null>(null)

  useEffect(() => {
    initializeRuaAPI().then(setRua).catch(console.error)
  }, [])

  if (!rua) return <div>Loading...</div>

  return (
      <NavigationProvider>
        <TodoList rua={rua} />
      </NavigationProvider>
  )
}

function TodoList({ rua }: { rua: RuaAPI }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { push } = useNavigation()

  // Load todos from storage
  useEffect(() => {
    rua.storage.get<Todo[]>('todos').then((stored) => {
      setTodos(stored || [])
      setIsLoading(false)
    })
  }, [rua])

  // Save todos to storage
  const saveTodos = async (newTodos: Todo[]) => {
    await rua.storage.set('todos', newTodos)
    setTodos(newTodos)
  }

  const addTodo = (values: any) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description || '',
      priority: values.priority || 'medium',
      done: false,
      createdAt: new Date().toISOString(),
    }
    saveTodos([...todos, newTodo])
    rua.notification.show({ title: 'Success', body: 'Todo created!' })
  }

  const toggleTodo = async (id: string) => {
    const updated = todos.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
    )
    await saveTodos(updated)
  }

  const deleteTodo = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id)
    await saveTodos(updated)
    await rua.notification.show({ title: 'Deleted', body: 'Todo removed' })
  }

  // Group todos by status
  const sections = [
    {
      title: 'Active',
      items: todos
          .filter((t) => !t.done)
          .map((todo): ListItem => ({
            id: todo.id,
            title: todo.title,
            subtitle: todo.description,
            icon: <span>{getPriorityIcon(todo.priority)}</span>,
            accessories: [
              { text: todo.priority.toUpperCase() },
            ],
            actions: [
              {
                id: 'toggle',
                title: 'Mark as Done',
                onAction: () => toggleTodo(todo.id),
              },
              {
                id: 'delete',
                title: 'Delete',
                onAction: () => deleteTodo(todo.id),
              },
            ],
          })),
    },
    {
      title: 'Completed',
      items: todos
          .filter((t) => t.done)
          .map((todo): ListItem => ({
            id: todo.id,
            title: todo.title,
            subtitle: todo.description,
            icon: <span>✅</span>,
            accessories: [
              { text: 'DONE' },
            ],
            actions: [
              {
                id: 'toggle',
                title: 'Mark as Active',
                onAction: () => toggleTodo(todo.id),
              },
              {
                id: 'delete',
                title: 'Delete',
                onAction: () => deleteTodo(todo.id),
              },
            ],
          })),
    },
  ]

  const globalActions = [
    {
      id: 'add',
      title: 'New Todo',
      icon: <span>➕</span>,
      shortcut: { key: 'n', modifiers: ['cmd'] as const },
      onAction: () => push(<CreateTodoForm onSubmit={addTodo} />),
    },
  ]

  return (
      <List
          searchPlaceholder="Search todos..."
          sections={sections}
          isLoading={isLoading}
          enablePinyin={true}
          actions={globalActions}
      />
  )
}

function CreateTodoForm({ onSubmit }: { onSubmit: (values: any) => void }) {
  const { pop } = useNavigation()

  const handleSubmit = (values: any) => {
    onSubmit(values)
    pop()
  }

  return (
      <Form onSubmit={handleSubmit} title="Create Todo">
        <Form.TextField
            name="title"
            label="Title"
            placeholder="Enter todo title"
            required
        />
        <Form.TextArea
            name="description"
            label="Description"
            placeholder="Optional description"
            rows={4}
        />
        <Form.Dropdown
            name="priority"
            label="Priority"
            items={[
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]}
        />
      </Form>
  )
}

function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high': return '🔴'
    case 'medium': return '🟡'
    case 'low': return '🟢'
    default: return '⚪'
  }
}

export default App
