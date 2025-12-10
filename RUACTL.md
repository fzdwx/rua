# ruactl - Rua Control Utility

A command-line utility for controlling the rua application launcher.

## Features

- Toggle window visibility from the command line
- Check if rua is running
- Works across all Hyprland workspaces

## Installation

### Option 1: Local Installation (Recommended)

```bash
# Build and install ruactl to ~/.local/bin
./install-ruactl.sh
```

This will:
1. Build the `ruactl` binary in release mode
2. Install it to `~/.local/bin/ruactl`
3. Make it executable

Make sure `~/.local/bin` is in your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Add this line to your `~/.bashrc` or `~/.zshrc` to make it permanent.

### Option 2: System-wide Installation

```bash
# Install both rua and ruactl to /usr/bin (requires sudo)
just install
```

This will install both `rua` and `ruactl` to `/usr/bin/`, making them available system-wide.

### Option 3: Download from GitHub Releases

Pre-built binaries are available in GitHub Releases:

```bash
# Download and extract
wget https://github.com/YOUR_USERNAME/rua/releases/latest/download/ruactl-linux-x86_64.tar.gz
tar -xzf ruactl-linux-x86_64.tar.gz

# Install to ~/.local/bin
mkdir -p ~/.local/bin
mv ruactl ~/.local/bin/
chmod +x ~/.local/bin/ruactl

# Or install system-wide
sudo mv ruactl /usr/bin/
```

## Usage

```bash
# Toggle window visibility
ruactl toggle

# Check if rua is running
ruactl health

# Show help
ruactl help
```

## Hyprland Integration

Add this to your Hyprland config (`~/.config/hypr/hyprland.conf`):

```
bind = ALT, Space, exec, ruactl toggle
```

This allows you to toggle rua from any workspace using `Alt+Space`.

## How It Works

- Rua runs an HTTP server on `127.0.0.1:7777` when it starts
- `ruactl` sends HTTP requests to this server
- The server controls the window visibility and workspace positioning
- On Hyprland, the window is automatically moved to the current workspace before showing

## Troubleshooting

If `ruactl` shows connection errors:
1. Make sure rua is running
2. Check if port 7777 is available
3. Check rua's console output for server startup messages
