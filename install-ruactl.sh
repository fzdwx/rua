#!/bin/bash
# Installation script for ruactl

set -e

echo "Building ruactl..."
cargo build --manifest-path src-tauri/Cargo.toml --bin ruactl --release

INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

echo "Installing ruactl to $INSTALL_DIR..."
cp src-tauri/target/release/ruactl "$INSTALL_DIR/"
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
echo "    ruactl toggle    # Toggle window visibility"
echo "    ruactl health    # Check if rua is running"
echo ""
