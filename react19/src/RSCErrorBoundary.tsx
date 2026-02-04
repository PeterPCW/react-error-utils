/**
 * RSCErrorBoundary - Error Boundary for React Server Components
 * Handles errors in server-rendered components
 */

import React from 'react'
import type { ReactNode, ErrorInfo as ReactErrorInfo } from 'react'

export interface RSCErrorBoundaryProps {
  children: ReactNode
  /**
   * Fallback to render when an error is caught
   */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /**
   * Callback when an error is caught
   */
  onError?: (error: Error, errorInfo: RSCErrorInfo) => void
  /**
   * Unique ID for this boundary
   */
  boundaryId?: string
}

/**
 * Error info for RSC errors
 */
export interface RSCErrorInfo {
  boundaryId?: string
  componentStack?: string
  digest?: string
}

/**
 * State for RSCErrorBoundary
 */
interface RSCErrorState {
  error: Error | null
  errorInfo: RSCErrorInfo | null
}

/**
 * ErrorBoundary for Server Components
 * 
 * @example
 * ```tsx
 * import { RSCErrorBoundary } from '@react-error-utils/react19'
 * 
 * export default function Page() {
 *   return (
 *     <RSCErrorBoundary
 *       fallback={<ErrorDisplay />}
 *       onError={(error, info) => {
 *         console.error('RSC Error:', error, info)
 *       }}
 *     >
 *       <ServerComponent />
 *     </RSCErrorBoundary>
 *   )
 * }
 * ```
 */
export class RSCErrorBoundary extends React.Component<RSCErrorBoundaryProps, RSCErrorState> {
  state: RSCErrorState = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<RSCErrorState> {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo): void {
    const { boundaryId, onError } = this.props

    const rscErrorInfo: RSCErrorInfo = {
      boundaryId,
      componentStack: errorInfo.componentStack || undefined,
      digest: (error as any).digest,
    }

    this.setState({ errorInfo: rscErrorInfo })

    onError?.(error, rscErrorInfo)

    // Store error globally for testing
    if (typeof window !== 'undefined') {
      (window as any).__RSC_ERROR__ = { error, errorInfo: rscErrorInfo }
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ error: null, errorInfo: null })
  }

  render(): ReactNode {
    const { fallback } = this.props
    const { error } = this.state

    if (error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.resetErrorBoundary)
      }
      return fallback
    }

    return this.props.children
  }
}

/**
 * Create a Promise-based error boundary for use() hook
 * 
 * @example
 * ```tsx
 * import { createErrorBoundary } from '@react-error-utils/react19'
 * 
 * function DataComponent({ promise }) {
 *   const [data, error] = createErrorBoundary(promise)
 *   
 *   if (error) {
 *     return <ErrorDisplay error={error} />
 *   }
 *   
 *   if (!data) {
 *     return <Loading />
 *   }
 *   
 *   return <DataDisplay data={data} />
 * }
 * ```
 */
export function createErrorBoundary<T>(
  promise: Promise<T>
): [T | null, Error | null, () => void] {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    promise.then(
      (result) => {
        setData(result)
        setError(null)
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setData(null)
      }
    )
  }, [promise])

  const reset = (): void => {
    setData(null)
    setError(null)
  }

  return [data, error, reset]
}

/**
 * Wrap a promise with error boundary support
 */
export function withErrorBoundary<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: {
    onError?: (error: Error) => void
    fallback?: (error: Error) => ReactNode
  } = {}
): (...args: Args) => [T | null, Error | null, boolean, () => void] {
  return (...args: Args) => {
    const [data, setData] = React.useState<T | null>(null)
    const [error, setError] = React.useState<Error | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
      let mounted = true

      fn(...args).then(
        (result) => {
          if (mounted) {
            setData(result)
            setError(null)
            setLoading(false)
          }
        },
        (err) => {
          if (mounted) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            setData(null)
            setLoading(false)
            options.onError?.(error)
          }
        }
      )

      return () => {
        mounted = false
      }
    }, [...args])

    const reset = (): void => {
      setData(null)
      setError(null)
      setLoading(true)
    }

    return [data, error, loading, reset]
  }
}

/**
 * Suspense-aware error boundary component
 */
export function SuspenseErrorBoundary({
  children,
  fallback,
  onError,
}: {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}) {
  return (
    <React.Suspense fallback={fallback}>
      <ErrorBoundaryWrapper onError={onError} fallback={fallback}>
        {children}
      </ErrorBoundaryWrapper>
    </React.Suspense>
  )
}

/**
 * Internal wrapper for SuspenseErrorBoundary
 */
function ErrorBoundaryWrapper({
  children,
  onError,
  fallback,
}: {
  children: ReactNode
  onError?: (error: Error) => void
  fallback?: ReactNode
}) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault()
      setError(new Error(event.message))
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    onError?.(error)
    return <>{fallback}</>
  }

  return <>{children}</>
}
