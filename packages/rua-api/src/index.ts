/**
 * rua-api - Plugin API for Rua command palette
 *
 * This package provides the public API for developing Rua plugins.
 * Plugin developers can import types, utilities, and shared components from this package.
 */

// Export all types
export * from "./types";

// Components removed - not currently used

// Export browser API for extensions
export * from "./browser";

export function toExtURL(path: string, extPath: string) {
  const encodedBaseDir = btoa(extPath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  let fileName = path.replace(/^\.\//, "");
  return `ext://${encodedBaseDir}/${fileName}`;
}
