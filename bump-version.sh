#!/bin/bash

# Version bump script for Rua project
# Usage: ./bump-version.sh <new-version> [release-notes]
# Example: ./bump-version.sh 0.2.0 "Added new features"

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <new-version> [release-notes]"
    echo "Example: $0 0.2.0 \"Added new features\""
    exit 1
fi

NEW_VERSION=$1
RELEASE_NOTES=${2:-"Release v${NEW_VERSION}"}

echo "🚀 Bumping version to ${NEW_VERSION}..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Get current version from package.json
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' package.json | head -1)
echo "Current version: ${CURRENT_VERSION}"
echo "New version: ${NEW_VERSION}"

# Update package.json
echo "📝 Updating package.json..."
sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json

# Update src-tauri/Cargo.toml
echo "📝 Updating src-tauri/Cargo.toml..."
sed -i "s/^version = \"${CURRENT_VERSION}\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml

# Update src-tauri/tauri.conf.json
echo "📝 Updating src-tauri/tauri.conf.json..."
sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json

# Update Cargo.lock
echo "📝 Updating Cargo.lock..."
cd src-tauri
cargo update -p rua
cd ..

# Check if there are any changes
if git diff --quiet; then
    echo "⚠️  No changes detected. Version might already be ${NEW_VERSION}"
    exit 1
fi

# Show changes
echo ""
echo "📋 Changes to be committed:"
git diff package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json

# Commit changes
echo ""
echo "💾 Committing changes..."
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json src-tauri/Cargo.lock
git commit -m "chore: bump version to ${NEW_VERSION}
# Create git tag
echo "🏷️  Creating tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "${RELEASE_NOTES}

🤖 Generated with Claude Code"

echo ""
echo "✅ Version bumped successfully!"
echo ""
echo "📌 Current commit: $(git log -1 --oneline)"
echo "📌 Current tag: $(git describe --tags)"
echo ""
echo "To push to remote:"
echo "  git push origin main"
echo "  git push origin v${NEW_VERSION}"
