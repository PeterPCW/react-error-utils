import { Component, ReactNode } from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState, ErrorInfo } from './types'

/**
 * ErrorBoundary component that catches React errors in its child tree
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<ErrorDisplay />}
 *   onError={(error, info) => Sentry.captureException(error)}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorInfoWithBoundary: ErrorInfo = {
      ...errorInfo,
      boundaryName: this.props.name ?? 'ErrorBoundary'
    }
    this.setState({ error, errorInfo: errorInfoWithBoundary })
    this.props.onError?.(error, errorInfoWithBoundary)
  }

  resetBoundary = (): void => {
    this.setState({ error: null, errorInfo: null })
    this.props.onReset?.()
    this.props.onResetBoundary?.()
  }

  render(): ReactNode {
    const { error, errorInfo } = this.state
    const { fallback, children } = this.props

    if (error) {
      if (typeof fallback === 'function') {
        // Provide default errorInfo if null
        const info: ErrorInfo = errorInfo || { componentStack: '' }
        return fallback(error, info)
      }
      return fallback
    }

    return children
  }
}
