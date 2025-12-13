# Hello Extension

A simple example extension demonstrating the Rua extension system.

## Structure

```
hello-ext/
├── manifest.json    # Extension configuration
├── index.html       # UI entry for view mode actions
├── init.js          # Initialization script (runs on extension load)
├── goodbye.js       # Command script for "Say Goodbye" action
└── README.md        # This file
```

## Actions

### Hello World (view mode)
- Opens a simple greeting UI
- Demonstrates how to use URL params to route to different views

### Say Goodbye (command mode)
- Executes a script without UI
- Shows a notification

## Permissions

- `notification` - To show system notifications
- `storage` - To store extension data

## Development

1. Copy this folder to your Rua extensions directory
2. The extension will be automatically detected and can be enabled in the Extension Manager
3. Use the command palette to access the extension's actions

## API Usage

The extension demonstrates:
- `api.storage.set()` - Storing data
- `api.notification.show()` - Showing notifications
- URL-based action routing in the UI
