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

# Get current version from root package.json
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' package.json | head -1)
echo "Current version: ${CURRENT_VERSION}"
echo "New version: ${NEW_VERSION}"

# Update root package.json
echo "📝 Updating package.json..."
sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json

# Update apps/rua/package.json
echo "📝 Updating apps/rua/package.json..."
sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" apps/rua/package.json

# Update packages/rua-api/package.json
echo "📝 Updating packages/rua-api/package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${NEW_VERSION}\"/" packages/rua-api/package.json

# Update packages/create-rua-ext/package.json
echo "📝 Updating packages/create-rua-ext/package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${NEW_VERSION}\"/" packages/create-rua-ext/package.json

# Update apps/rua/src-tauri/Cargo.toml
echo "📝 Updating apps/rua/src-tauri/Cargo.toml..."
sed -i "s/^version = \"[^\"]*\"/version = \"${NEW_VERSION}\"/" apps/rua/src-tauri/Cargo.toml

# Update apps/rua/src-tauri/tauri.conf.json
echo "📝 Updating apps/rua/src-tauri/tauri.conf.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${NEW_VERSION}\"/" apps/rua/src-tauri/tauri.conf.json

# Update Cargo.lock
echo "📝 Updating Cargo.lock..."
cd apps/rua/src-tauri
cargo update -p rua
cd "$SCRIPT_DIR"

# Update documentation files
echo "📝 Updating documentation installation paths..."
sed -i "s/rua_${CURRENT_VERSION}_amd64\\.deb/rua_${NEW_VERSION}_amd64.deb/g" apps/docs/content/docs/getting-started/installation.mdx
sed -i "s/rua-${CURRENT_VERSION}-1\\.x86_64\\.rpm/rua-${NEW_VERSION}-1.x86_64.rpm/g" apps/docs/content/docs/getting-started/installation.mdx
sed -i "s/rua_${CURRENT_VERSION}_amd64\\.AppImage/rua_${NEW_VERSION}_amd64.AppImage/g" apps/docs/content/docs/getting-started/installation.mdx

sed -i "s/rua_${CURRENT_VERSION}_amd64\\.deb/rua_${NEW_VERSION}_amd64.deb/g" apps/docs/content/docs/user-guide/installation.mdx
sed -i "s/rua-${CURRENT_VERSION}-1\\.x86_64\\.rpm/rua-${NEW_VERSION}-1.x86_64.rpm/g" apps/docs/content/docs/user-guide/installation.mdx
sed -i "s/rua_${CURRENT_VERSION}_amd64\\.AppImage/rua_${NEW_VERSION}_amd64.AppImage/g" apps/docs/content/docs/user-guide/installation.mdx

sed -i "s/rua_${CURRENT_VERSION}_amd64\\.deb/rua_${NEW_VERSION}_amd64.deb/g" apps/docs/content/docs/getting-started/quick-start.mdx

# Check if there are any changes
if git diff --quiet; then
    echo "⚠️  No changes detected. Version might already be ${NEW_VERSION}"
    exit 1
fi

# Commit changes
echo ""
echo "💾 Committing changes..."
git add package.json \
    apps/rua/package.json \
    packages/rua-api/package.json \
    packages/create-rua-ext/package.json \
    apps/rua/src-tauri/Cargo.toml \
    apps/rua/src-tauri/tauri.conf.json \
    apps/rua/src-tauri/Cargo.lock \
    apps/docs/content/docs/getting-started/installation.mdx \
    apps/docs/content/docs/user-guide/installation.mdx \
    apps/docs/content/docs/getting-started/quick-start.mdx

git commit -m "chore: bump version to ${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create git tag
echo "🏷️  Creating tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "${RELEASE_NOTES}"

echo ""
echo "✅ Version bumped successfully!"
echo ""
echo "📌 Current commit: $(git log -1 --oneline)"
echo "📌 Current tag: $(git describe --tags)"
echo ""
echo "To push to remote:"
echo "  git push origin main"
echo "  git push origin v${NEW_VERSION}"
