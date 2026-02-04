/**
 * useError - React 19 use() hook integration for error handling
 * 
 * React 19 introduces the use() hook for handling promises and contexts.
 * This module provides utilities for integrating error boundaries with use().
 */

import React, { use } from 'react'

export interface UseErrorOptions {
  /**
   * Callback when an error is caught
   */
  onError?: (error: Error) => void
  /**
   * Whether to throw the error after catching (for testing)
   */
  rethrow?: boolean
}

/**
 * Wrapper for use() that catches errors
 * 
 * @example
 * ```tsx
 * import { useError } from '@react-error-utils/react19'
 * 
 * function DataComponent({ promise }) {
 *   const data = useError(promise, {
 *     onError: (error) => {
 *       console.error('Failed to load data:', error)
 *     }
 *   })
 * 
 * return <DataDisplay data={data} />
 * }
 * ```
 */
export function useError<T>(
  promise: Promise<T>,
  options: UseErrorOptions = {}
): T {
  const { onError, rethrow = false } = options

  try {
    return use(promise)
  } catch (error) {
    if (error instanceof Error) {
      onError?.(error)
      if (rethrow) throw error
      // Return null for error state - caller should handle
      return null as T
    }
    // Handle non-Error throws
    const wrappedError = new Error(typeof error === 'string' ? error : 'Unknown error')
    onError?.(wrappedError)
    if (rethrow) throw wrappedError
    return null as T
  }
}

/**
 * Create a resource that handles errors with use()
 * 
 * @example
 * ```tsx
 * import { createResource } from '@react-error-utils/react19'
 * 
 * function useData(url: string) {
 *   return createResource(
 *     () => fetch(url).then(r => r.json()),
 *     {
 *       onError: (error) => console.error('Failed to fetch:', error)
 *     }
 *   )
 * }
 * 
 * function Component() {
 *   const [data, error] = useData('/api/data')
 *   
 *   if (error) return <ErrorDisplay error={error} />
 *   if (!data) return <Loading />
 *   
 *   return <DataDisplay data={data} />
 * }
 * ```
 */
export function createResource<T>(
  fetcher: () => Promise<T>,
  options: {
    onError?: (error: Error) => void
    onSuccess?: (data: T) => void
  } = {}
): [T | null, Error | null, () => void] {
  const { onError, onSuccess } = options

  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    fetcher()
      .then((result) => {
        if (mounted) {
          setData(result)
          onSuccess?.(result)
        }
      })
      .catch((err) => {
        if (mounted) {
          const wrappedError = err instanceof Error ? err : new Error(String(err))
          setError(wrappedError)
          onError?.(wrappedError)
        }
      })

    return () => {
      mounted = false
    }
  }, [fetcher, onError, onSuccess])

  const reset = (): void => {
    setData(null)
    setError(null)
  }

  return [data, error, reset]
}

/**
 * use() hook wrapper for handling rejected promises with a fallback
 *
 * @example
 * ```tsx
 * import { usePromise } from '@react-error-utils/react19'
 *
 * function AsyncData({ promise, fallback }) {
 *   const data = usePromise(promise, fallback)
 *   return <DataDisplay data={data} />
 * }
 * ```
 */
export function usePromise(
  promise: Promise<any>,
  fallback: React.ReactNode | ((error: Error) => React.ReactNode)
): React.ReactNode {
  try {
    return use(promise)
  } catch (error) {
    if (typeof fallback === 'function') {
      return fallback(error instanceof Error ? error : new Error(String(error)))
    }
    return fallback ?? null
  }
}

/**
 * useContext wrapper that throws if context is missing
 * 
 * @example
 * ```tsx
 * import { useRequiredContext } from '@react-error-utils/react19'
 * 
 * function Component() {
 *   const theme = useRequiredContext(ThemeContext)
 *   return <div className={theme}>Themed</div>
 * }
 * ```
 */
export function useRequiredContext<T>(
  Context: React.Context<T | null>,
  errorMessage: string = 'Context not provided'
): T {
  const value = React.useContext(Context)
  
  if (value === null) {
    throw new Error(errorMessage)
  }
  
  return value
}

/**
 * Resource type for use() hook (compatible with Usable<T>)
 */
export interface Resource<T> extends Promise<T> {
  read: () => T
  status: 'pending' | 'success' | 'error'
  data: T | null
  error: Error | null
}

/**
 * Create a resource for use() hook
 */
export function createResourceResource<T>(
  promise: Promise<T>
): Resource<T> {
  let status: Resource<T>['status'] = 'pending'
  let data: T | null = null
  let error: Error | null = null

  const resource = promise.then(
    (result) => {
      status = 'success'
      data = result
      return result
    },
    (err) => {
      status = 'error'
      error = err instanceof Error ? err : new Error(String(err))
      throw error
    }
  ) as Resource<T>

  resource.read = function() {
    if (status === 'pending') {
      throw promise
    }
    if (status === 'error') {
      throw error
    }
    return data!
  }
  resource.status = status
  resource.data = data
  resource.error = error

  return resource
}

/**
 * use() hook for reading resources
 */
export function useResource<T>(resource: Resource<T>): T {
  return use(resource as unknown as Promise<T>)
}

/**
 * Wrap a function to return a Resource
 */
export function toResource<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Resource<T> {
  return (...args: Args) => {
    return createResourceResource(fn(...args))
  }
}
