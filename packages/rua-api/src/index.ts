/**
 * rua-api - Plugin API for Rua command palette
 *
 * This package provides the public API for developing Rua plugins.
 * Plugin developers can import types, utilities, and shared components from this package.
 */

// Export version
export const VERSION = "0.1.0";

// Export all types
export * from "./types";

// Components removed - not currently used

// Export browser API for extensions
export * from "./browser";
