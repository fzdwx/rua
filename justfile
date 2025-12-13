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
    cd packages/rua-api && bun run build && bun publish --registry https://registry.npmjs.org --access public 
    @echo "✓ rua-api published to bun"

# Publish create-rua-ext to npm
publish-ext-cli:
    cd packages/create-rua-ext && bun run build && bun publish --registry https://registry.npmjs.org --access public 
    @echo "✓ create-rua-ext published to bun"

# Publish all packages to npm
publish-all: publish-api publish-ext-cli
    @echo "✓ All packages published to bun"

# Install example extension for testing
install-example-ext:
    mkdir -p ~/.local/share/rua/extensions
    cp -r examples/hello-ext ~/.local/share/rua/extensions/
    @echo "✓ hello-ext installed to ~/.local/share/rua/extensions/"

# Create and install a test extension
test-ext name="test-extension":
    cd /tmp && bunx create-rua-ext {{name}} --template basic
    mkdir -p ~/.local/share/rua/extensions
    cp -r /tmp/{{name}} ~/.local/share/rua/extensions/
    @echo "✓ {{name}} created and installed"

# Run Rua in development mode
dev:
    bun run --cwd apps/rua tauri dev