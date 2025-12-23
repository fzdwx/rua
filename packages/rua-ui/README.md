# @fzdwx/ruaui

Pre-built React UI components for Rua extensions. This package provides a Raycast-inspired component library that allows extensions to render entire pages with integrated search and results.

## Installation

```bash
bun add @fzdwx/ruaui
```

## Features

- **Integrated Search**: Search box and results in a single unified view
- **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, and Escape
- **Fuzzy Search**: Built-in Fuse.js integration for fuzzy matching
- **Pinyin Support**: Optional Chinese pinyin search support
- **Virtual Scrolling**: Performant rendering of large lists using @tanstack/react-virtual
- **Form Components**: Complete form system with validation
- **Navigation**: Built-in view navigation system
- **TypeScript**: Full type safety with TypeScript definitions

## Components

### List

Main list view component with integrated search and virtualized results.

```typescript
import { List } from '@fzdwx/ruaui';

function MyExtension() {
  const items = [
    {
      id: '1',
      title: 'First Item',
      subtitle: 'This is a subtitle',
      icon: <Icon />,
    },
    {
      id: '2',
      title: 'Second Item',
      subtitle: 'Another subtitle',
    },
  ];

  return (
    <List
      searchPlaceholder="Search items..."
      items={items}
      onSelect={(item) => console.log('Selected:', item)}
      enablePinyin={true}
    />
  );
}
```

**Props:**

- `searchPlaceholder?: string` - Placeholder text for search input
- `items?: ListItem[]` - Array of items to display
- `sections?: ListSection[]` - Grouped items with section headers
- `onSearch?: (query: string) => void` - Callback when search changes
- `onSelect?: (item: ListItem) => void` - Callback when item is selected
- `enablePinyin?: boolean` - Enable Chinese pinyin search
- `isLoading?: boolean` - Show loading indicator
- `emptyView?: ReactNode` - Custom empty state component

### Form

Form component with built-in validation and field management.

```typescript
import { Form } from '@fzdwx/ruaui';

function MyForm() {
  const handleSubmit = (values) => {
    console.log('Form submitted:', values);
  };

  return (
    <Form onSubmit={handleSubmit} title="Create Todo">
      <Form.TextField name="title" label="Title" required />
      <Form.TextArea name="description" label="Description" rows={4} />
      <Form.Dropdown
        name="priority"
        label="Priority"
        items={[
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ]}
      />
      <Form.Checkbox name="done" label="Completed" />
    </Form>
  );
}
```

**Form Fields:**

- `Form.TextField` - Single-line text input
- `Form.TextArea` - Multi-line text input
- `Form.Dropdown` - Select dropdown
- `Form.Checkbox` - Checkbox input

### Navigation

Navigation system for switching between views.

```typescript
import { List, Form, useNavigation, NavigationProvider } from '@fzdwx/ruaui';

function App() {
  return (
    <NavigationProvider>
      <TodoList />
    </NavigationProvider>
  );
}

function TodoList() {
  const { push } = useNavigation();

  const items = todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    actions: [
      {
        id: 'edit',
        title: 'Edit',
        onAction: () => push(<EditForm todo={todo} />),
      },
    ],
  }));

  return <List items={items} onSelect={(item) => console.log(item)} />;
}
```

### ActionPanel

Action buttons with keyboard shortcuts.

```typescript
import { ActionPanel } from '@fzdwx/ruaui';

const actions = [
  {
    id: 'save',
    title: 'Save',
    icon: <SaveIcon />,
    shortcut: { key: 's', modifiers: ['cmd'] },
    onAction: () => save(),
  },
  {
    id: 'cancel',
    title: 'Cancel',
    onAction: () => cancel(),
  },
];

<ActionPanel actions={actions} position="footer" />
```

### Detail

Detail view for displaying content.

```typescript
import { Detail } from '@fzdwx/ruaui';

function ItemDetail({ item }) {
  return (
    <Detail
      title={item.title}
      markdown={item.markdown}
      actions={[
        {
          id: 'copy',
          title: 'Copy',
          onAction: () => copyToClipboard(item.content),
        },
      ]}
    />
  );
}
```

## Hooks

### useSearch

Hook for searching items with fuzzy search and optional pinyin support.

```typescript
import { useSearch } from "@fzdwx/ruaui";

const results = useSearch({
  items: myItems,
  query: searchQuery,
  enablePinyin: true,
});
```

### useKeyboard

Hook for handling keyboard navigation.

```typescript
import { useKeyboard } from "@fzdwx/ruaui";

useKeyboard({
  onArrowUp: () => decrementIndex(),
  onArrowDown: () => incrementIndex(),
  onEnter: () => selectItem(),
  onEscape: () => close(),
  enabled: true,
});
```

### useNavigation

Hook for navigation between views.

```typescript
import { useNavigation } from '@fzdwx/ruaui';

const { push, pop, canPop } = useNavigation();

push(<DetailView />);
if (canPop) pop();
```

## Styling

The package includes CSS with design system variables. Import the styles in your extension:

```typescript
import "@fzdwx/ruaui/styles";
```

Or if your bundler handles CSS automatically, it will be included when you import components.

## Complete Example

```typescript
import { useState } from 'react';
import { List, Form, useNavigation, NavigationProvider } from '@fzdwx/ruaui';

interface Todo {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

function TodoExtension() {
  return (
    <NavigationProvider>
      <TodoList />
    </NavigationProvider>
  );
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { push } = useNavigation();

  const items = todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    subtitle: todo.description,
    accessories: [
      {
        text: todo.done ? '✓' : '',
      },
    ],
    actions: [
      {
        id: 'edit',
        title: 'Edit',
        onAction: () => push(<EditTodoForm todo={todo} onSave={updateTodo} />),
      },
      {
        id: 'delete',
        title: 'Delete',
        shortcut: { key: 'd', modifiers: ['cmd'] },
        onAction: () => deleteTodo(todo.id),
      },
    ],
  }));

  return (
    <List
      searchPlaceholder="Search todos..."
      items={items}
      onSelect={(item) => console.log('Selected:', item)}
      enablePinyin={true}
    />
  );
}

function EditTodoForm({ todo, onSave }: { todo: Todo; onSave: (values: any) => void }) {
  const { pop } = useNavigation();

  const handleSubmit = (values: any) => {
    onSave({ ...todo, ...values });
    pop();
  };

  return (
    <Form onSubmit={handleSubmit} title="Edit Todo">
      <Form.TextField name="title" label="Title" required />
      <Form.TextArea name="description" label="Description" rows={4} />
      <Form.Checkbox name="done" label="Completed" />
    </Form>
  );
}

export default TodoExtension;
```

## TypeScript

All components are fully typed. Import types from the package:

```typescript
import type { ListItem, ListSection, Action, FormProps } from "@fzdwx/ruaui";
```

## License

MIT
