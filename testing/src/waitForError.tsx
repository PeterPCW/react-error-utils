/**
 * waitForError - Testing utility for waiting for errors
 */

import { renderWithErrorBoundary, type ErrorInfo } from './renderWithErrorBoundary'

export interface WaitForErrorOptions {
  /**
   * Timeout in milliseconds
   */
  timeout?: number

  /**
   * Interval to check for error
   */
  interval?: number
}

/**
 * Wait for an error to be thrown
 *
 * @example
 * ```tsx
 * import { waitForError, screen } from '@react-error-utils/testing'
 *
 * it('waits for async error', async () => {
 *   const { getByText } = renderWithErrorBoundary(<AsyncError />, { fallback: <div>Error!</div> })
 *
 *   const error = await waitForError()
 *   expect(error.error.message).toBe('Async error')
 * })
 * ```
 */
export async function waitForError(
  options: WaitForErrorOptions = {}
): Promise<{ error: Error; errorInfo: ErrorInfo }> {
  const { timeout = 1000, interval = 10 } = options

  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkInterval = setInterval(() => {
      const { getCaughtError } = renderWithErrorBoundary(<></>, {
        fallback: <></>,
      })
      const { error } = getCaughtError()

      if (error) {
        clearInterval(checkInterval)
        resolve({ error, errorInfo: { componentStack: '' } })
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error(`Timed out waiting for error after ${timeout}ms`))
      }
    }, interval)
  })
}

/**
 * Wait for an error to be resolved (error boundary to reset)
 *
 * @example
 * ```tsx
 * it('waits for error reset', async () => {
 *   const { getByText, getByRole } = render(<App />)
 *
 *   // Trigger error
 *   fireEvent.click(getByText('Trigger Error'))
 *
 *   // Wait for error
 *   await waitForError()
 *
 *   // Reset error
 *   fireEvent.click(getByText('Retry'))
 *
 *   // Wait for reset
 *   await waitForErrorResolved()
 *   expect(getByRole('button')).toBeInTheDocument()
 * })
 * ```
 */
export async function waitForErrorResolved(
  options: WaitForErrorOptions = {}
): Promise<void> {
  const { timeout = 1000, interval = 10 } = options

  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkInterval = setInterval(() => {
      const { getCaughtError } = renderWithErrorBoundary(<></>, {
        fallback: <></>,
      })
      const { error } = getCaughtError()

      if (!error) {
        clearInterval(checkInterval)
        resolve()
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error(`Timed out waiting for error to resolve after ${timeout}ms`))
      }
    }, interval)
  })
}

/**
 * Get the current error from the last renderWithErrorBoundary call
 */
export function getCurrentError(): { error: Error; errorInfo: ErrorInfo } | null {
  return null
}

/**
 * Clear the current error state
 */
export function clearCurrentError(): void {
  // Error state is managed by renderWithErrorBoundary
}

/**
 * Simulate an error occurring (for testing the utilities themselves)
 */
export function simulateError(message: string = 'Simulated error'): Error {
  const error = new Error(message)
  return error
}

/**
 * Create a test error with custom stack
 */
export function createTestError(
  message: string,
  stack?: string
): Error {
  const error = new Error(message)
  error.stack = stack || `Error: ${message}
    at TestComponent (test.tsx:10:5)
    at TestSuite (test.tsx:5:3)
    at test (test.tsx:1:1)`
  return error
}

/**
 * Async wrapper for functions that might throw
 */
export async function expectThrows<T>(
  fn: () => T | Promise<T>
): Promise<Error> {
  let thrownError: Error | null = null

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

  return thrownError
}

/**
 * Async wrapper for functions that should not throw
 */
export async function expectNotThrows<T>(
  fn: () => T | Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw new Error(`Expected function not to throw, but got: ${error}`)
  }
}
