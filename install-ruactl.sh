#!/bin/bash
# Installation script for ruactl

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building ruactl..."
cargo build --manifest-path "$SCRIPT_DIR/apps/rua/src-tauri/Cargo.toml" --bin ruactl --release

INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

echo "Installing ruactl to $INSTALL_DIR..."
cp "$SCRIPT_DIR/apps/rua/src-tauri/target/release/ruactl" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/ruactl"

echo ""
echo "✓ ruactl installed successfully!"
echo ""
echo "Make sure $INSTALL_DIR is in your PATH."
echo "You can add it by adding this line to your ~/.bashrc or ~/.zshrc:"
echo ""
echo '    export PATH="$HOME/.local/bin:$PATH"'
echo ""
echo "Usage:"
echo "    ruactl toggle              # Toggle window visibility"
echo "    ruactl health              # Check if rua is running"
echo "    ruactl validate [path]     # Validate extension manifest"
echo "    ruactl pack [path]         # Package extension into .rua format"
echo "    ruactl pack --dry-run      # List files without creating archive"
echo ""
