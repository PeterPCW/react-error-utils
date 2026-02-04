import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Retry options
 */
export interface UseRetryOptions<T> {
  /** Maximum number of retry attempts */
  maxAttempts?: number
  /** Initial delay in milliseconds */
  initialDelayMs?: number
  /** Maximum delay in milliseconds */
  maxDelayMs?: number
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number
  /** Jitter factor (0-1) to add randomness */
  jitter?: number
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** Callback on successful attempt */
  onSuccess?: (data: T) => void
  /** Callback on final failure */
  onFailure?: (error: Error, attempts: number) => void
  /** Whether to start automatically */
  autoStart?: boolean
}

/**
 * Return type for useRetry hook
 */
export interface UseRetryReturn<T> {
  /** Function to start the operation */
  execute: () => Promise<T | null>
  /** Function to abort current attempt */
  abort: () => void
  /** Current attempt number (0 = not started) */
  attempt: number
  /** Whether currently waiting/retrying */
  isRetrying: boolean
  /** Whether operation completed successfully */
  isSuccess: boolean
  /** Whether operation failed permanently */
  isFailed: boolean
  /** Current delay (for countdown display) */
  delayMs: number
  /** Latest error if failed */
  error: Error | null
  /** Reset to initial state */
  reset: () => void
}

/**
 * Hook to add retry functionality to async operations with exponential backoff
 * 
 * @param asyncFn - The async function to retry
 * @param options - Retry configuration
 * @returns Object with execute function and state
 * 
 * @example
 * ```tsx
 * const { execute, isRetrying, error } = useRetry(fetchData, {
 *   maxAttempts: 3,
 *   initialDelayMs: 1000,
 *   backoffMultiplier: 2,
 * })
 * 
 * await execute()
 * ```
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: UseRetryOptions<T> = {}
): UseRetryReturn<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitter = 0.1,
    shouldRetry = () => true,
    onSuccess,
    onFailure,
    autoStart = false
  } = options

  const [attempt, setAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [delayMs, setDelayMs] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  const abortRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)

  const calculateDelay = (currentAttempt: number): number => {
    const baseDelay = initialDelayMs * Math.pow(backoffMultiplier, currentAttempt - 1)
    const cappedDelay = Math.min(baseDelay, maxDelayMs)
    
    // Add jitter
    const jitterAmount = cappedDelay * jitter
    const minDelay = cappedDelay - jitterAmount
    const maxDelay = cappedDelay + jitterAmount
    
    return minDelay + Math.random() * (maxDelay - minDelay)
  }

  const execute = useCallback(async (): Promise<T | null> => {
    if (isRetrying) return null
    
    abortRef.current = false
    attemptRef.current = 1
    setAttempt(1)
    setIsSuccess(false)
    setIsFailed(false)
    setError(null)
    setDelayMs(0)

    const runAttempt = async (currentAttempt: number): Promise<T | null> => {
      if (abortRef.current) return null

      try {
        const result = await asyncFn()
        setIsSuccess(true)
        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err as Error
        
        if (currentAttempt >= maxAttempts || !shouldRetry(error, currentAttempt)) {
          setIsFailed(true)
          setError(error)
          onFailure?.(error, currentAttempt)
          return null
        }

        // Calculate delay for next attempt
        const delay = calculateDelay(currentAttempt)
        setDelayMs(delay)
        setIsRetrying(true)

        // Wait before retry
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            resolve()
          }, delay)
        })

        if (abortRef.current) return null

        // Next attempt
        const nextAttempt = currentAttempt + 1
        attemptRef.current = nextAttempt
        setAttempt(nextAttempt)
        setIsRetrying(false)
        setDelayMs(0)

        return runAttempt(nextAttempt)
      }
    }

    return runAttempt(1)
  }, [asyncFn, maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, jitter, shouldRetry, onSuccess, onFailure])

  const abort = useCallback(() => {
    abortRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsRetrying(false)
    setDelayMs(0)
  }, [])

  const reset = useCallback(() => {
    abort()
    setAttempt(0)
    setIsSuccess(false)
    setIsFailed(false)
    setError(null)
    setDelayMs(0)
    attemptRef.current = 0
  }, [])

  // Auto-start if option is set
  useEffect(() => {
    if (autoStart) {
      execute()
    }
  }, [autoStart, execute])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    execute,
    abort,
    attempt,
    isRetrying,
    isSuccess,
    isFailed,
    delayMs,
    error,
    reset
  }
}
