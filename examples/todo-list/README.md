# todo-list

TODO List

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun build
```

## Installation

1. Run `bun build` to build the extension
2. Copy the entire folder to your Rua extensions directory
3. Enable the extension in the Extension Manager

## Permissions

- `clipboard`
- `notification`
- `storage`
- `http`
- `shell`
- `fs:read`
- `fs:read-dir`
- `fs:write`
- `fs:exists`
- `fs:stat`


## Features

- Clipboard read/write access
- System notifications
- Local storage for extension data
- UI control (hide/show input, close extension)
- Dynamic action registration

## License

MIT