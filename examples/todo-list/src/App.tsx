import {useState, useEffect} from "react";
import {initializeRuaAPI, type RuaAPI} from "rua-api/browser";
import {
  List,
  Form,
  Detail,
  Grid,
  ActionPanel,
  Action,
  Icon,
  Toast,
  showToast,
  useNavigation,
  formatRelativeDate,
} from "@rua/ui";

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  createdAt: string;
  dueDate?: string;
  tags?: string[];
}

type ViewMode = "list" | "grid";

function App() {
  const [rua, setRua] = useState<RuaAPI | null>(null);

  useEffect(() => {
    initializeRuaAPI().then(setRua).catch(console.error);
  }, []);

  if (!rua) return <div>Loading...</div>;

  return <TodoList rua={rua}/>;
}

function TodoList({rua}: { rua: RuaAPI }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const {push} = useNavigation();

  // Load todos from storage
  useEffect(() => {
    rua.storage.get<Todo[]>("todos").then((stored) => {
      setTodos(stored || []);
      setIsLoading(false);
    });
  }, [rua]);

  // Save todos to storage
  const saveTodos = async (newTodos: Todo[]) => {
    await rua.storage.set("todos", newTodos);
    setTodos(newTodos);
  };

  const addTodo = async (values: Record<string, unknown>) => {
    const tagsInput = values.tags as string;
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: values.title as string,
      description: (values.description as string) || "",
      priority: (values.priority as "high" | "medium" | "low") || "medium",
      done: false,
      createdAt: new Date().toISOString(),
      dueDate: values.dueDate ? (values.dueDate as Date).toISOString() : undefined,
      tags: tagsInput
        ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : [],
    };
    await saveTodos([...todos, newTodo]);
    await showToast({
      style: Toast.Style.Success,
      title: "Success",
      message: "Todo created!",
    });
  };

  const updateTodo = async (id: string, values: Record<string, unknown>) => {
    const tagsInput = values.tags as string;
    const updated = todos.map((t) =>
      t.id === id
        ? {
          ...t,
          title: values.title as string,
          description: (values.description as string) || "",
          priority: (values.priority as "high" | "medium" | "low") || t.priority,
          dueDate: values.dueDate ? (values.dueDate as Date).toISOString() : undefined,
          tags: tagsInput
            ? tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
            : [],
        }
        : t
    );
    await saveTodos(updated);
    await showToast({
      style: Toast.Style.Success,
      title: "Updated",
      message: "Todo updated!",
    });
  };

  const toggleTodo = async (id: string) => {
    const updated = todos.map((t) => (t.id === id ? {...t, done: !t.done} : t));
    await saveTodos(updated);
    const todo = todos.find((t) => t.id === id);
    await showToast({
      style: Toast.Style.Success,
      title: todo?.done ? "Marked as Active" : "Marked as Done",
    });
  };

  const deleteTodo = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    await saveTodos(updated);
    await showToast({
      style: Toast.Style.Success,
      title: "Deleted",
      message: "Todo removed",
    });
  };

  // Apply filters
  const filteredTodos = todos.filter((todo) => {
    // Status filter
    if (filter === "active" && todo.done) return false;
    if (filter === "completed" && !todo.done) return false;
    if (filter === "high" && todo.priority !== "high") return false;
    if (filter === "medium" && todo.priority !== "medium") return false;
    if (filter === "low" && todo.priority !== "low") return false;
    return true;
  });

  const activeTodos = filteredTodos.filter((t) => !t.done);
  const completedTodos = filteredTodos.filter((t) => t.done);

  const selectedTodo = selectedTodoId ? todos.find(t => t.id === selectedTodoId) : null;

  return (
    <List
      navigationTitle="Todo List"
      searchBarPlaceholder="Search todos..."
      isLoading={isLoading}
      enablePinyin={true}
      showBackButton={true}
      isShowingDetail={showDetail}
      onSelectionChange={setSelectedTodoId}
      actions={
        <ActionPanel>
          <Action
            title="Create Todo"
            icon={<Icon source={Icon.Plus}/>}
            shortcut={{key: "n", modifiers: ["cmd"]}}
            onAction={() => push(<CreateTodoForm onSubmit={addTodo}/>)}
          />
        </ActionPanel>
      }
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter Todos"
          value={filter}
          onChange={setFilter}
        >
          <List.Dropdown.Section title="Status">
            <List.Dropdown.Item title="All" value="all" />
            <List.Dropdown.Item title="Active" value="active" />
            <List.Dropdown.Item title="Completed" value="completed" />
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Priority">
            <List.Dropdown.Item title="High Priority" value="high" />
            <List.Dropdown.Item title="Medium Priority" value="medium" />
            <List.Dropdown.Item title="Low Priority" value="low" />
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {/* Empty View */}
      {todos.length === 0 && !isLoading && (
        <List.EmptyView
          icon={<Icon source={Icon.Document} size={48}/>}
          title="No Todos Yet"
          description="Create your first todo to get started"
        />
      )}

      {/* Active Section */}
      {activeTodos.length > 0 && (
        <List.Section title="Active" subtitle={`${activeTodos.length} items`}>
          {activeTodos.map((todo) => (
            <List.Item
              key={todo.id}
              id={todo.id}
              title={todo.title}
              subtitle={todo.description}
              icon={<span>{getPriorityIcon(todo.priority)}</span>}
              keywords={[todo.priority, ...(todo.tags || [])]}
              accessories={[
                ...(todo.dueDate
                  ? [
                    {
                      date: new Date(todo.dueDate),
                      tooltip: `Due ${formatDate(todo.dueDate)}`,
                    },
                  ]
                  : []),
                {
                  tag: todo.priority.toUpperCase(),
                  color: getPriorityColor(todo.priority),
                  tooltip: `Priority: ${todo.priority}`,
                },
                {
                  date: new Date(todo.createdAt),
                  tooltip: "Created",
                },
              ]}
              detail={
                <List.Item.Detail
                  markdown={`
# ${todo.title}

${todo.description || "*No description provided*"}

---

**Status:** ${todo.done ? "✅ Completed" : "⏳ Active"}

**Priority:** ${getPriorityIcon(todo.priority)} ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}

**Created:** ${formatDate(todo.createdAt)}

${todo.dueDate ? `**Due Date:** ${formatDate(todo.dueDate)}` : ""}

${todo.tags && todo.tags.length > 0 ? `**Tags:** ${todo.tags.join(", ")}` : ""}
                  `.trim()}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label
                        title="Status"
                        text={todo.done ? "Completed" : "Active"}
                        icon={<Icon source={todo.done ? Icon.Checkmark : Icon.Clock}/>}
                      />
                      <List.Item.Detail.Metadata.Label
                        title="Priority"
                        text={{
                          value: todo.priority.toUpperCase(),
                          color: getPriorityColor(todo.priority),
                        }}
                        icon={<span>{getPriorityIcon(todo.priority)}</span>}
                      />
                      <List.Item.Detail.Metadata.Separator/>
                      <List.Item.Detail.Metadata.Label
                        title="Created"
                        text={formatDate(todo.createdAt)}
                        icon={<Icon source={Icon.Calendar}/>}
                      />
                      {todo.dueDate && (
                        <List.Item.Detail.Metadata.Label
                          title="Due Date"
                          text={formatDate(todo.dueDate)}
                          icon={<Icon source={Icon.Clock}/>}
                        />
                      )}
                      {todo.tags && todo.tags.length > 0 && (
                        <>
                          <List.Item.Detail.Metadata.Separator/>
                          <List.Item.Detail.Metadata.TagList title="Tags">
                            {todo.tags.map((tag, index) => (
                              <List.Item.Detail.Metadata.TagList.Item
                                key={index}
                                text={tag}
                                color={getTagColor(index)}
                              />
                            ))}
                          </List.Item.Detail.Metadata.TagList>
                        </>
                      )}
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel title={todo.title}>
                  <ActionPanel.Section title="Actions">
                    <Action
                      title="View Details"
                      icon={<Icon source={Icon.Eye}/>}
                      shortcut={{key: "enter"}}
                      onAction={() =>
                        push(
                          <TodoDetail
                            todo={todo}
                            onToggle={toggleTodo}
                            onDelete={deleteTodo}
                            onUpdate={updateTodo}
                          />
                        )
                      }
                    />
                    <Action
                      title="Mark as Done"
                      icon={<Icon source={Icon.Checkmark}/>}
                      shortcut={{key: "d", modifiers: ["cmd"]}}
                      onAction={() => toggleTodo(todo.id)}
                    />
                    <Action
                      title="Delete"
                      icon={<Icon source={Icon.Trash}/>}
                      shortcut={{key: "backspace", modifiers: ["cmd"]}}
                      onAction={() => deleteTodo(todo.id)}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Copy">
                    <Action.CopyToClipboard
                      title="Copy Title"
                      content={todo.title}
                      shortcut={{key: "c", modifiers: ["cmd"]}}
                    />
                    <Action.CopyToClipboard
                      title="Copy Description"
                      content={todo.description || "(No description)"}
                      shortcut={{key: "c", modifiers: ["cmd", "shift"]}}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Navigation">
                    <Action.Push
                      title="Edit Todo"
                      icon={<Icon source={Icon.Edit}/>}
                      shortcut={{key: "e", modifiers: ["cmd"]}}
                      target={
                        <CreateTodoForm
                          onSubmit={(values) => updateTodo(todo.id, values)}
                          initialValues={todo}
                          isEditing
                        />
                      }
                    />
                    <Action
                      title={showDetail ? "Hide Detail" : "Show Detail"}
                      icon={<Icon source={Icon.Eye}/>}
                      shortcut={{key: "d", modifiers: ["cmd", "shift"]}}
                      onAction={() => setShowDetail(!showDetail)}
                    />
                    <Action
                      title="Switch to Grid View"
                      icon={<Icon source={Icon.Grid}/>}
                      shortcut={{key: "g", modifiers: ["cmd"]}}
                      onAction={() => setViewMode("grid")}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Create">
                    <Action
                      title="Create New Todo"
                      icon={<Icon source={Icon.Plus}/>}
                      shortcut={{key: "n", modifiers: ["cmd"]}}
                      onAction={() => push(<CreateTodoForm onSubmit={addTodo}/>)}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {/* Completed Section */}
      {completedTodos.length > 0 && (
        <List.Section title="Completed" subtitle={`${completedTodos.length} items`}>
          {completedTodos.map((todo) => (
            <List.Item
              key={todo.id}
              id={todo.id}
              title={todo.title}
              subtitle={todo.description}
              icon={<span>✅</span>}
              accessories={[
                {
                  tag: "DONE",
                  color: "#10b981",
                  tooltip: "Completed",
                },
                {
                  date: new Date(todo.createdAt),
                  tooltip: "Created",
                },
              ]}
              actions={
                <ActionPanel title={todo.title}>
                  <ActionPanel.Section title="Actions">
                    <Action
                      title="View Details"
                      icon={<Icon source={Icon.Eye}/>}
                      shortcut={{key: "enter"}}
                      onAction={() =>
                        push(
                          <TodoDetail
                            todo={todo}
                            onToggle={toggleTodo}
                            onDelete={deleteTodo}
                            onUpdate={updateTodo}
                          />
                        )
                      }
                    />
                    <Action
                      title="Mark as Active"
                      icon={<Icon source={Icon.ArrowLeft}/>}
                      shortcut={{key: "d", modifiers: ["cmd"]}}
                      onAction={() => toggleTodo(todo.id)}
                    />
                    <Action
                      title="Delete"
                      icon={<Icon source={Icon.Trash}/>}
                      shortcut={{key: "backspace", modifiers: ["cmd"]}}
                      onAction={() => deleteTodo(todo.id)}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Copy">
                    <Action.CopyToClipboard title="Copy Title" content={todo.title}/>
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Create">
                    <Action
                      title="Create New Todo"
                      icon={<Icon source={Icon.Plus}/>}
                      shortcut={{key: "n", modifiers: ["cmd"]}}
                      onAction={() => push(<CreateTodoForm onSubmit={addTodo}/>)}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

// Detail View Component
interface TodoDetailProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, values: Record<string, unknown>) => void;
}

function TodoDetail({todo, onToggle, onDelete, onUpdate}: TodoDetailProps) {
  const {push, pop} = useNavigation();

  const markdown = `
# ${todo.title}

${todo.description || "*No description provided*"}

---

**Status:** ${todo.done ? "✅ Completed" : "⏳ Active"}

**Priority:** ${getPriorityIcon(todo.priority)} ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}

**Created:** ${formatDate(todo.createdAt)}

${todo.dueDate ? `**Due Date:** ${formatDate(todo.dueDate)}` : ""}
`;

  return (
    <Detail
      navigationTitle={todo.title}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Status"
            text={todo.done ? "Completed" : "Active"}
            icon={<Icon source={todo.done ? Icon.Checkmark : Icon.Clock}/>}
          />
          <Detail.Metadata.Label
            title="Priority"
            text={todo.priority.toUpperCase()}
            icon={<span>{getPriorityIcon(todo.priority)}</span>}
          />
          <Detail.Metadata.Separator/>
          <Detail.Metadata.Label
            title="Created"
            text={formatDate(todo.createdAt)}
            icon={<Icon source={Icon.Calendar}/>}
          />
          {todo.dueDate && (
            <Detail.Metadata.Label
              title="Due Date"
              text={formatDate(todo.dueDate)}
              icon={<Icon source={Icon.Clock}/>}
            />
          )}
          {todo.tags && todo.tags.length > 0 && (
            <>
              <Detail.Metadata.Separator/>
              <Detail.Metadata.TagList title="Tags">
                {todo.tags.map((tag, index) => (
                  <Detail.Metadata.TagList.Item key={index} text={tag} color={getTagColor(index)}/>
                ))}
              </Detail.Metadata.TagList>
            </>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title={todo.done ? "Mark as Active" : "Mark as Done"}
            icon={<Icon source={todo.done ? Icon.Circle : Icon.Checkmark}/>}
            onAction={() => {
              onToggle(todo.id);
              pop();
            }}
          />
          <Action
            title="Edit"
            icon={<Icon source={Icon.Pencil}/>}
            onAction={() =>
              push(
                <CreateTodoForm
                  onSubmit={(values) => onUpdate(todo.id, values)}
                  initialValues={todo}
                  isEditing
                />
              )
            }
          />
          <Action
            title="Delete"
            icon={<Icon source={Icon.Trash}/>}
            onAction={() => {
              onDelete(todo.id);
              pop();
            }}
          />
        </ActionPanel>
      }
    />
  );
}

interface CreateTodoFormProps {
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Todo;
  isEditing?: boolean;
}

function CreateTodoForm({onSubmit, initialValues, isEditing}: CreateTodoFormProps) {
  const {pop} = useNavigation();

  const handleSubmit = (values: Record<string, unknown>) => {
    onSubmit(values);
    pop();
  };

  return (
    <Form
      navigationTitle={isEditing ? "Edit Todo" : "Create Todo"}
      onSubmit={handleSubmit}
      actions={
        <ActionPanel>
          <Action
            title={isEditing ? "Save Changes" : "Create Todo"}
            icon={<Icon source={Icon.Checkmark}/>}
            onAction={() => {
              // Form submission is handled by the Form component's onSubmit
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Enter todo title"
        defaultValue={initialValues?.title}
        autoFocus
      />
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Optional description (supports Markdown)"
        defaultValue={initialValues?.description}
        rows={4}
        enableMarkdownPreview
      />
      <Form.Dropdown
        id="priority"
        title="Priority"
        defaultValue={initialValues?.priority || "medium"}
      >
        <Form.Dropdown.Item value="high" title="🔴 High"/>
        <Form.Dropdown.Item value="medium" title="🟡 Medium"/>
        <Form.Dropdown.Item value="low" title="🟢 Low"/>
      </Form.Dropdown>
      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        type="date"
        defaultValue={initialValues?.dueDate ? new Date(initialValues.dueDate) : undefined}
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="Enter tags separated by commas (e.g., work, urgent)"
        defaultValue={initialValues?.tags?.join(", ")}
      />
    </Form>
  );
}

function getPriorityIcon(priority: string): string {
  switch (priority) {
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "#ef4444"; // red
    case "medium":
      return "#f59e0b"; // amber
    case "low":
      return "#10b981"; // green
    default:
      return "#6b7280"; // gray
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTagColor(index: number): string {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  return colors[index % colors.length];
}

export default App;
