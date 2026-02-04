import { ReactNode } from 'react'

/**
 * Error info returned by React's error boundary
 */
export interface ErrorInfo {
  componentStack: string
  boundaryName?: string
}

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** The content to render */
  children: ReactNode

  /** Optional name for the error boundary (appears in error reports) */
  name?: string

  /** Fallback component to render when an error occurs */
  fallback: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)

  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void

  /** Called when the error is reset */
  onReset?: () => void

  /** Called when a child tries to reset the error boundary */
  onResetBoundary?: () => void
}

/**
 * Return type for useErrorBoundary hook
 */
export interface UseErrorBoundaryReturn {
  /** Function to show the error boundary */
  showBoundary: (error: Error) => void
  
  /** Current error state */
  error: Error | null
  
  /** Whether an error has been caught */
  hasError: boolean
  
  /** Function to reset the error boundary */
  resetBoundary: () => void
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  error: Error | null
  errorInfo: ErrorInfo | null
}
