import { useState, useCallback, useContext, createContext } from 'react'
import type { UseErrorBoundaryReturn, ErrorInfo } from './types'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Context for nested error boundaries
 */
const ErrorBoundaryContext = createContext<{
  showBoundary: (error: Error) => void
  resetBoundary: () => void
} | null>(null)

/**
 * Hook to use the nearest error boundary
 *
 * @returns Object with showBoundary function and error state
 *
 * @example
 * ```tsx
 * const { showBoundary, error, resetBoundary } = useErrorBoundary()
 *
 * try {
 *   await riskyOperation()
 * } catch (err) {
 *   showBoundary(err as Error)
 * }
 * ```
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const context = useContext(ErrorBoundaryContext)

  // When inside an ErrorBoundaryProvider, use the context's methods
  // and don't maintain local error state
  if (context) {
    const [error, setError] = useState<Error | null>(null)

    const showBoundary = useCallback((err: Error) => {
      setError(err)
      context.showBoundary(err)
    }, [context.showBoundary])

    const resetBoundary = useCallback(() => {
      setError(null)
      context.resetBoundary()
    }, [context.resetBoundary])

    return {
      showBoundary,
      error,
      hasError: error !== null,
      resetBoundary
    }
  }

  // When NOT inside an error boundary context, maintain local error state
  const [error, setError] = useState<Error | null>(null)

  const showBoundary = useCallback((error: Error) => {
    setError(error)
  }, [])

  const resetBoundary = useCallback(() => {
    setError(null)
  }, [])

  return {
    showBoundary,
    error,
    hasError: error !== null,
    resetBoundary
  }
}

/**
 * Provider component for nested error boundaries
 */
export function ErrorBoundaryProvider({
  children,
  name = 'ErrorBoundaryProvider',
  onError,
  onReset
}: {
  children: React.ReactNode
  name?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
}) {
  const [error, setError] = useState<Error | null>(null)

  const showBoundary = useCallback((err: Error) => {
    setError(err)
    onError?.(err, { componentStack: '', boundaryName: name })
  }, [onError, name])

  const resetBoundary = useCallback(() => {
    setError(null)
    onReset?.()
  }, [onReset])

  if (error) {
    return null // Fallback should be handled by parent
  }

  return (
    <ErrorBoundaryContext.Provider value={{ showBoundary, resetBoundary }}>
      {children}
    </ErrorBoundaryContext.Provider>
  )
}

/**
 * Helper to create an error boundary with a hook
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode,
  name?: string,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} name={name} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
