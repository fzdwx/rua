/**
 * rua-api - Plugin API for Rua command palette
 * 
 * This package provides the public API for developing Rua plugins.
 * Plugin developers can import types, utilities, and shared components from this package.
 */

// Export version
export const VERSION = '0.1.0';

// Export all types
export * from './types';

// Export manifest utilities
export * from './manifest';

// Export registry
export * from './registry';

// Export loader
export * from './loader';

// Export API utilities
export * from './api';

// Export components
export * from './components';

// Shared components will be exported here
// export * from './components';
