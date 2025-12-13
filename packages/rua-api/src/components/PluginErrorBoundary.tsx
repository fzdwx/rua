/**
 * Plugin Error Boundary
 * 
 * Catches errors in plugin view components and displays a fallback UI.
 * Based on Requirements 7.3
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

/**
 * Props for PluginErrorBoundary
 */
export interface PluginErrorBoundaryProps {
  /** Plugin ID for error reporting */
  pluginId: string;
  /** Action ID for error reporting */
  actionId?: string;
  /** Children to render */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for PluginErrorBoundary
 */
interface PluginErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default error fallback component
 */
export function PluginErrorFallback({
  pluginId,
  actionId,
  error,
  onRetry,
}: {
  pluginId: string;
  actionId?: string;
  error: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="text-red-500 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        Plugin Error
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {pluginId}{actionId ? ` / ${actionId}` : ''}
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Error boundary component for plugin views
 * 
 * Wraps plugin view components to catch and handle errors gracefully.
 */
export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  constructor(props: PluginErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PluginErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `Plugin error in ${this.props.pluginId}${this.props.actionId ? `/${this.props.actionId}` : ''}:`,
      error,
      errorInfo
    );
    
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PluginErrorFallback
          pluginId={this.props.pluginId}
          actionId={this.props.actionId}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
