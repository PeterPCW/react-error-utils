import { useCallback, useState } from 'react'

/**
 * Error handler options
 */
export interface UseErrorHandlerOptions {
  /** Maximum number of errors to keep in history */
  maxErrors?: number
  /** Callback when an error is handled */
  onError?: (error: Error) => void
}

/**
 * Return type for useErrorHandler hook
 */
export interface UseErrorHandlerReturn {
  /** Function to handle an error */
  handleError: (error: Error) => void
  /** Array of handled errors */
  errors: Error[]
  /** Function to clear error history */
  clearErrors: () => void
  /** Get the most recent error */
  latestError: Error | null
}

/**
 * Hook to handle errors with optional history tracking
 * 
 * @param options - Configuration options
 * @returns Object with handleError function and error state
 * 
 * @example
 * ```tsx
 * const { handleError, errors } = useErrorHandler()
 * 
 * try {
 *   await fetchData()
 * } catch (err) {
 *   handleError(err as Error)
 * }
 * ```
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const { maxErrors = 10, onError } = options
  
  const [errors, setErrors] = useState<Error[]>([])
  
  const handleError = useCallback((error: Error) => {
    onError?.(error)
    
    // Add to history with state update to trigger re-render
    setErrors(prev => [error, ...prev].slice(0, maxErrors))
  }, [onError, maxErrors])
  
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])
  
  return {
    handleError,
    errors,
    clearErrors,
    latestError: errors[0] || null
  }
}
