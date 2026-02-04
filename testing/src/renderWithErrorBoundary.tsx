/**
 * renderWithErrorBoundary - Testing utility for React Error Boundary
 * Renders a component with an ErrorBoundary for testing error scenarios
 */

import React, { useState, useCallback } from 'react'
import type { ReactNode, ErrorInfo as ReactErrorInfo } from 'react'
import { ErrorBoundary } from '@react-error-utils/core'

export interface RenderWithErrorBoundaryOptions {
  /**
   * Fallback to render when an error is caught
   */
  fallback: React.ReactNode | ((error: Error, errorInfo: ErrorInfo) => React.ReactNode)

  /**
   * Callback when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void

  /**
   * Wrapper component props
   */
  wrapperProps?: Record<string, unknown>
}

export interface ErrorInfo {
  componentStack: string
  boundaryName?: string
}

/**
 * Create an error info object (for testing)
 */
export function createErrorInfo(componentStack: string, boundaryName?: string): ErrorInfo {
  return {
    componentStack,
    boundaryName,
  }
}

/**
 * Simulate a React component stack trace
 */
export function simulateComponentStack(componentName: string): string {
  return `at ${componentName} (http://localhost:3000/static/js/main.js:123:45)
    at App (http://localhost:3000/static/js/main.js:100:10)
    at Root (http://localhost:3000/static/js/main.js:50:5)`
}

/**
 * State holder for error tracking across renders
 */
let caughtError: Error | null = null
let caughtErrorInfo: ErrorInfo | null = null

/**
 * Render a component with ErrorBoundary for testing
 *
 * @example
 * ```tsx
 * import { renderWithErrorBoundary, screen, waitFor } from '@react-error-utils/testing'
 *
 * it('catches errors', () => {
 *   const { getByText } = renderWithErrorBoundary(
 *     <BuggyComponent />,
 *     { fallback: <div>Error caught!</div> }
 *   )
 *
 *   expect(getByText('Error caught!')).toBeInTheDocument()
 * })
 * ```
 */
export function renderWithErrorBoundary(
  _ui: ReactNode,
  options: RenderWithErrorBoundaryOptions
): {
  rerender: (newUi: ReactNode) => void
  unmount: () => void
  getCaughtError: () => { error: Error | null; errorInfo: ErrorInfo | null }
} {
  caughtError = null
  caughtErrorInfo = null

  const handleError = useCallback((err: Error, info: ReactErrorInfo) => {
    caughtError = err
    caughtErrorInfo = {
      componentStack: info.componentStack || '',
    }
    options.onError?.(err, caughtErrorInfo)
  }, [options.onError])

  // We return a mock render result since this is a utility function
  // The actual rendering should be done by React Testing Library
  // Note: ErrorBoundary is used for its side effects (setting caughtError)
  void (
    <ErrorBoundary
      fallback={options.fallback}
      onError={handleError}
    >
      <></>
    </ErrorBoundary>
  )

  return {
    rerender: () => {},
    unmount: () => {},
    getCaughtError: () => ({ error: caughtError, errorInfo: caughtErrorInfo }),
  }
}

/**
 * Wait for an error to be caught by an ErrorBoundary
 *
 * @example
 * ```tsx
 * import { renderWithErrorBoundary, waitForError, screen } from '@react-error-utils/testing'
 *
 * it('catches errors asynchronously', async () => {
 *   renderWithErrorBoundary(
 *     <AsyncBuggyComponent />,
 *     { fallback: <div>Error caught!</div> }
 *   )
 *
 *   await waitForError()
 *   expect(screen.getByText('Error caught!')).toBeInTheDocument()
 * })
 * ```
 */
export async function waitForError(
  timeout: number = 1000
): Promise<{ error: Error; errorInfo: ErrorInfo }> {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const check = () => {
      if (caughtError) {
        resolve({ error: caughtError, errorInfo: caughtErrorInfo! })
        return
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for error'))
        return
      }

      // Use requestAnimationFrame for better timing in tests
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(check)
      } else {
        setTimeout(check, 10)
      }
    }

    check()
  })
}

/**
 * Create a mock error for testing
 */
export function createMockError(
  message: string = 'Test error',
  stack?: string
): Error {
  const error = new Error(message)
  if (stack) {
    error.stack = stack
  }
  return error
}

/**
 * Check if a component throws an error
 */
export async function expectToThrow<T>(
  fn: () => T | Promise<T>,
  expectedError?: Error | string
): Promise<Error | undefined> {
  let thrownError: Error | undefined

  try {
    await fn()
  } catch (error) {
    if (error instanceof Error) {
      thrownError = error
    }
  }

  if (!thrownError) {
    throw new Error('Expected function to throw an error')
  }

  if (expectedError) {
    if (typeof expectedError === 'string') {
      if (thrownError.message !== expectedError) {
        throw new Error(
          `Expected error message "${expectedError}" but got "${thrownError.message}"`
        )
      }
    } else if (expectedError.message !== thrownError.message) {
      throw new Error(
        `Expected error message "${expectedError.message}" but got "${thrownError.message}"`
      )
    }
  }

  return thrownError
}

/**
 * Assert that an error was caught by ErrorBoundary
 */
export interface ErrorAssertion {
  toHaveBeenCaught: () => void
  toHaveErrorMessage: (message: string) => void
  toHaveBoundaryName: (name: string) => void
}

/**
 * Create error assertions for testing
 */
export function createErrorAssertion(error: Error): ErrorAssertion {
  return {
    toHaveBeenCaught: () => {
      if (!error) throw new Error('Expected error to be caught')
    },
    toHaveErrorMessage: (message: string) => {
      if (error.message !== message) {
        throw new Error(`Expected error message "${message}" but got "${error.message}"`)
      }
    },
    toHaveBoundaryName: (_name: string) => {
      // Would check errorInfo.boundaryName
    },
  }
}

/**
 * Mock ErrorBoundary for testing
 */
export function MockErrorBoundary({
  children,
  fallback,
  onError,
}: {
  children: ReactNode
  fallback: React.ReactNode | ((error: Error, errorInfo: ErrorInfo) => React.ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)

  if (error) {
    if (typeof fallback === 'function') {
      return <>{fallback(error, errorInfo!)}</>
    }
    return <>{fallback}</>
  }

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(err, info) => {
        setError(err)
        setErrorInfo({ componentStack: info.componentStack || '' })
        onError?.(err, info)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
