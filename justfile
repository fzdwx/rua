#!/usr/bin/env just --justfile
export PATH := join(justfile_directory(), "node_modules", "bin") + ":" + env_var('PATH')

build:
  pnpm run build

bump version:
    sh bump-version.sh {{version}}

install:
    jq '.bundle.active = false' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
    bun run build
    sudo cp src-tauri/target/release/rua /usr/bin/
    jq '.bundle.active = true' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json