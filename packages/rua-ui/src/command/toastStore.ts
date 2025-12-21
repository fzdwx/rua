import type { Toast, ToastType } from "./types";

type ToastListener = (toast: Toast | null) => void;

// Global state
let currentToast: Toast | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const listeners: Set<ToastListener> = new Set();

// Default duration in milliseconds (matches animation cycle)
const DEFAULT_DURATION = 2000;

/**
 * Generate a unique ID for each toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Options for toast.promise()
 */
export interface ToastPromiseOptions<T> {
  /** Message to show while loading */
  loading: string;
  /** Message to show on success (can be a function that receives the result) */
  success: string | ((data: T) => string);
  /** Message to show on failure (can be a function that receives the error) */
  failure: string | ((error: unknown) => string);
}

/**
 * Notify all listeners of toast state change
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener(currentToast));
}

/**
 * Clear any existing dismiss timer
 */
function clearDismissTimer(): void {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

/**
 * Show a toast message in the footer area (Raycast style)
 * @param message - The message text to display
 * @param type - Toast type: 'success' (green dot) | 'failure' (red dot) | 'animated' (spinner)
 * @param duration - Auto-dismiss duration in ms. Default 2000. Set to 0 for persistent toast
 */
export function showToast(
  message: string,
  type: ToastType,
  duration?: number
): void {
  // Don't show toast for empty messages
  if (!message || message.trim() === '') {
    return;
  }

  // Clear any existing timer
  clearDismissTimer();

  // Validate type, default to 'success' if invalid
  const validTypes: ToastType[] = ['success', 'failure', 'animated'];
  const validatedType = validTypes.includes(type) ? type : 'success';

  // Handle duration: use default if undefined, handle negative values
  let finalDuration = duration ?? DEFAULT_DURATION;
  if (finalDuration < 0) {
    finalDuration = DEFAULT_DURATION;
  }

  // Create new toast (replaces any existing toast)
  currentToast = {
    id: generateId(),
    message,
    type: validatedType,
    duration: finalDuration,
  };

  notifyListeners();

  // Set up auto-dismiss if duration > 0
  if (finalDuration > 0) {
    dismissTimer = setTimeout(() => {
      hideToast();
    }, finalDuration);
  }
}

/**
 * Hide the current toast
 */
export function hideToast(): void {
  clearDismissTimer();
  currentToast = null;
  notifyListeners();
}

/**
 * Subscribe to toast state changes
 * @param listener - Callback function that receives the current toast state
 * @returns Unsubscribe function
 */
export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  // Immediately call with current state
  listener(currentToast);
  
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get the current toast state (for testing or synchronous access)
 */
export function getCurrentToast(): Toast | null {
  return currentToast;
}

/**
 * Show toast for async operations with automatic success/failure handling
 *
 * @example
 * ```ts
 * const result = await toast.promise(uploadImage(), {
 *   loading: "Uploading image...",
 *   success: "Image uploaded!",
 *   failure: "Failed to upload image"
 * });
 *
 * // With dynamic messages
 * const result = await toast.promise(fetchUser(id), {
 *   loading: "Loading user...",
 *   success: (user) => `Welcome, ${user.name}!`,
 *   failure: (err) => `Error: ${err.message}`
 * });
 * ```
 */
async function toastPromise<T>(
  promise: Promise<T>,
  options: ToastPromiseOptions<T>
): Promise<T> {
  // Show loading toast (persistent until resolved)
  showToast(options.loading, "animated", 0);

  try {
    const result = await promise;

    // Show success toast
    const successMessage =
      typeof options.success === "function" ? options.success(result) : options.success;
    showToast(successMessage, "success");

    return result;
  } catch (error) {
    // Show failure toast
    const failureMessage =
      typeof options.failure === "function" ? options.failure(error) : options.failure;
    showToast(failureMessage, "failure");

    throw error;
  }
}

/**
 * Toast API object with promise helper
 */
export const toast = {
  /**
   * Show a toast message
   */
  show: showToast,

  /**
   * Hide the current toast
   */
  hide: hideToast,

  /**
   * Show toast for async operations with automatic success/failure handling
   */
  promise: toastPromise,
};
