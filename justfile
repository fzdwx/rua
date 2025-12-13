#!/usr/bin/env just --justfile
export PATH := join(justfile_directory(), "node_modules", "bin") + ":" + env_var('PATH')

build:
  bun run build

bump version:
    sh bump-version.sh {{version}}

install:
    jq '.bundle.active = false' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
    bun tauri-build
    cargo build --manifest-path src-tauri/Cargo.toml --bin ruactl --release
    sudo cp src-tauri/target/release/rua /usr/bin/
    sudo cp src-tauri/target/release/ruactl /usr/bin/
    jq '.bundle.active = true' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
    @echo "✓ rua and ruactl installed to /usr/bin/"

# Build rua-api package
build-api:
    cd packages/rua-api && bun run build
    @echo "✓ rua-api built"

# Build create-rua-ext CLI
build-ext-cli:
    cd packages/create-rua-ext && bun run build
    @echo "✓ create-rua-ext built"

# Publish rua-api to npm
publish-api:
    cd packages/rua-api && bun run build && npm publish --access public
    @echo "✓ rua-api published to npm"

# Publish create-rua-ext to npm
publish-ext-cli:
    cd packages/create-rua-ext && bun run build && npm publish --access public
    @echo "✓ create-rua-ext published to npm"

# Publish all packages to npm
publish-all: publish-api publish-ext-cli
    @echo "✓ All packages published to npm"