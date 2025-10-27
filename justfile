#!/usr/bin/env just --justfile
export PATH := join(justfile_directory(), "node_modules", "bin") + ":" + env_var('PATH')

build:
  pnpm run build

bump version:
    sh bump-version.sh {{version}}