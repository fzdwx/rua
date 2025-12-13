/**
 * Manifest utilities - consolidated module
 * 
 * Handles validation, serialization, and formatting of extension manifests.
 */

// Re-export everything from individual modules
export { 
  validateManifest, 
  parseManifest, 
  formatManifest, 
  formatManifestCompact, 
  formatManifestJson,
  ManifestValidationError,
  type ValidationResult,
  type FormatOptions
} from './validator';

export { 
  serializeManifest, 
  deserializeManifest, 
  readManifestFile, 
  writeManifestFile 
} from './serializer';
