/**
 * Extension Manifest Serializer
 *
 * Handles serialization and deserialization of plugin manifests.
 * Based on Requirements 3.3
 */

import type { ExtensionManifest } from '../types/manifest';
import { parseManifest, type ValidationResult } from './validator';

/**
 * Serialize a manifest to JSON string
 *
 * @param manifest - Plugin manifest object
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string
 */
export function serializeManifest(manifest: ExtensionManifest, pretty = true): string {
  return JSON.stringify(manifest, null, pretty ? 2 : undefined);
}

/**
 * Deserialize a manifest from JSON string
 * This is an alias for parseManifest for consistency
 *
 * @param json - JSON string
 * @returns Validation result with parsed manifest
 */
export function deserializeManifest(json: string): ValidationResult {
  // Reuse the parseManifest function to avoid code duplication
  return parseManifest(json);
}

/**
 * Read manifest from file (for Node.js/Tauri environment)
 * This is a placeholder - actual implementation depends on runtime
 *
 * @param path - File path
 * @returns Promise with validation result
 */
export async function readManifestFile(path: string): Promise<ValidationResult> {
  // This will be implemented in the Tauri backend
  // For now, throw an error indicating it needs runtime implementation
  throw new Error(`readManifestFile not implemented for path: ${path}`);
}

/**
 * Write manifest to file (for Node.js/Tauri environment)
 * This is a placeholder - actual implementation depends on runtime
 *
 * @param path - File path
 * @param manifest - Plugin manifest
 * @returns Promise
 */
export async function writeManifestFile(path: string, manifest: ExtensionManifest): Promise<void> {
  // This will be implemented in the Tauri backend
  throw new Error(`writeManifestFile not implemented for path: ${path}, manifest: ${manifest.id}`);
}
