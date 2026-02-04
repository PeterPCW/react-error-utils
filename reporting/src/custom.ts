/**
 * Custom Reporter API for @react-error-utils
 * Build your own error reporting adapters
 */

import type { ErrorInfo } from '@react-error-utils/core'

export interface ReporterOptions {
  name: string
  version?: string
  beforeSend?: (event: ReporterEvent, error: Error, errorInfo?: ErrorInfo) => ReporterEvent | null
  filters?: Array<{
    pattern: RegExp | string
    action: 'exclude' | 'mask'
  }>
}

export interface ReporterEvent {
  id?: string
  timestamp: string
  level: 'error' | 'warning' | 'info'
  message: string
  stacktrace?: string
  context?: Record<string, any>
  tags?: Record<string, string | number | boolean>
  user?: {
    id?: string
    email?: string
    name?: string
  }
  request?: {
    url?: string
    method?: string
    headers?: Record<string, string>
  }
}

/**
 * Create a custom error reporter
 * 
 * @example
 * ```tsx
 * import { createReporter } from '@react-error-utils/reporting'
 * 
 * const myReporter = createReporter({
 *   name: 'my-app',
 *   beforeSend: (event) => {
 *     // Add custom tags
 *     event.tags = { ...event.tags, version: '1.0.0' }
 *     return event
 *   }
 * })
 * 
 * <ErrorBoundary onError={myReporter}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export function createReporter(options: ReporterOptions) {
  const { name, version, beforeSend, filters = [] } = options

  let eventCount = 0

  /**
   * Generate unique event ID
   */
  function generateId(): string {
    return `${name}-${Date.now()}-${++eventCount}`
  }

  /**
   * Apply filters to event data
   */
  function applyFilters(event: ReporterEvent): ReporterEvent {
    let filtered = { ...event }

    for (const filter of filters) {
      if (typeof filter.pattern === 'string') {
        if (filter.action === 'exclude') {
          if (filtered.message.includes(filter.pattern)) {
            return { ...filtered, message: '[FILTERED]' }
          }
        } else if (filter.action === 'mask') {
          filtered = {
            ...filtered,
            message: filtered.message.replace(
              new RegExp(filter.pattern, 'g'),
              '[MASKED]'
            ),
          }
        }
      } else if (filter.pattern instanceof RegExp) {
        if (filter.action === 'exclude') {
          if (filter.pattern.test(filtered.message)) {
            return { ...filtered, message: '[FILTERED]' }
          }
        } else if (filter.action === 'mask') {
          filtered = {
            ...filtered,
            message: filtered.message.replace(filter.pattern, '[MASKED]'),
          }
        }
      }
    }

    return filtered
  }

  /**
   * Create the reporter function
   */
  return function reporter(error: Error, errorInfo?: ErrorInfo): void {
    const baseEvent: ReporterEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stacktrace: errorInfo?.componentStack || error.stack,
      context: {
        errorName: error.name,
        ...(errorInfo && {
          boundaryName: errorInfo.boundaryName,
        }),
      },
      tags: {
        reporter: name,
        ...(version && { version }),
      },
    }

    // Apply filters
    const filteredEvent = applyFilters(baseEvent)

    // Call beforeSend hook if provided
    const finalEvent = beforeSend ? beforeSend(filteredEvent, error, errorInfo) : filteredEvent

    if (!finalEvent) return

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${name}] Error captured`)
      console.error('Error:', finalEvent.message)
      console.error('Stack:', finalEvent.stacktrace)
      console.groupEnd()
    }
  }
}

/**
 * Create a batch reporter for sending multiple errors together
 */
export function createBatchReporter(
  reporter: ReturnType<typeof createReporter>,
  options: {
    batchSize?: number
    flushInterval?: number
    sendBatch: (events: ReporterEvent[]) => Promise<void> | void
  }
): (error: Error, errorInfo?: ErrorInfo) => void {
  const { batchSize = 10, flushInterval = 5000, sendBatch } = options
  const batch: ReporterEvent[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Flush the current batch
   */
  async function flush(): Promise<void> {
    if (batch.length === 0) return

    const events = [...batch]
    batch.length = 0

    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }

    try {
      await sendBatch(events)
    } catch (error) {
      console.error('[react-error-utils] Failed to send batch:', error)
    }
  }

  /**
   * Create the batch reporter function
   */
  return function batchReporter(error: Error, errorInfo?: ErrorInfo): void {
    // Create event without sending
    const event: ReporterEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stacktrace: errorInfo?.componentStack || error.stack,
    }

    batch.push(event)

    // Flush if batch is full
    if (batch.length >= batchSize) {
      flush()
      return
    }

    // Schedule flush
    if (!flushTimer) {
      flushTimer = setTimeout(flush, flushInterval)
    }
  }
}

/**
 * Create a console reporter for development
 */
export function createConsoleReporter(options: {
  format?: 'json' | 'pretty'
  level?: 'error' | 'warning' | 'info'
} = {}): (error: Error, errorInfo?: ErrorInfo) => void {
  const { format = 'pretty', level = 'error' } = options

  return function consoleReporter(error: Error, errorInfo?: ErrorInfo): void {
    const event: ReporterEvent = {
      timestamp: new Date().toISOString(),
      level,
      message: error.message,
      stacktrace: errorInfo?.componentStack || error.stack,
      context: {
        errorName: error.name,
        ...(errorInfo && { boundaryName: errorInfo.boundaryName }),
      },
    }

    if (format === 'json') {
      console[level](JSON.stringify(event, null, 2))
    } else {
      console.group(`[${level.toUpperCase()}] ${event.message}`)
      console.error('Error:', event.message)
      if (event.stacktrace) {
        console.error('Stack:', event.stacktrace)
      }
      if (event.context) {
        console.error('Context:', event.context)
      }
      console.groupEnd()
    }
  }
}
