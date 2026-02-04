/**
 * Sentry Reporter for @react-error-utils
 * Zero-config Sentry integration
 */

import type { ErrorInfo } from '@react-error-utils/core'

export interface SentryReporterOptions {
  dsn: string
  environment?: string
  release?: string
  beforeSend?: (event: SentryEvent, error: Error, errorInfo?: ErrorInfo) => SentryEvent | null
  tags?: Record<string, string>
  extra?: Record<string, any>
}

export interface SentryEvent {
  message: string
  exception?: {
    values: Array<{
      type: string
      value: string
      stacktrace?: {
        frames: Array<{
          filename: string
          lineno: number
          colno: number
          function: string
        }>
      }
    }>
  }
  tags?: Record<string, string>
  extra?: Record<string, any>
}

/**
 * Create a Sentry reporter function
 * 
 * @example
 * ```tsx
 * import { createSentryReporter } from '@react-error-utils/reporting'
 * 
 * const sentryReporter = createSentryReporter({
 *   dsn: 'https://xxx@sentry.io/xxx'
 * })
 * 
 * <ErrorBoundary onError={sentryReporter}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export function createSentryReporter(options: SentryReporterOptions) {
  const { dsn, environment = 'production', release, beforeSend, tags = {}, extra = {} } = options

  let initialized = false

  /**
   * Initialize Sentry if available
   */
  function initSentry(): void {
    if (initialized) return

    // Check if @sentry/react is available
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import to avoid bundling Sentry
        const Sentry = (window as any).__SENTRY__
        if (Sentry) {
          Sentry.init({
            dsn,
            environment,
            release,
          })
          initialized = true
        }
      } catch {
        // Sentry not available, will use manual reporting
      }
    }
  }

  /**
   * Create the error reporter function
   */
  return function sentryReporter(error: Error, errorInfo?: ErrorInfo): void {
    // Try to use @sentry/react if available
    if (typeof window !== 'undefined') {
      try {
        const SentryReact = (window as any).SentryReact
        if (SentryReact) {
          SentryReact.captureException(error, {
            extra: errorInfo?.componentStack,
          })
          return
        }
      } catch {
        // Continue with manual reporting
      }
    }

    // Manual event creation
    const event: SentryEvent = {
      message: error.message,
      exception: {
        values: [
          {
            type: error.name || 'Error',
            value: error.message,
            stacktrace: errorInfo?.componentStack
              ? {
                  frames: parseComponentStack(errorInfo.componentStack),
                }
              : undefined,
          },
        ],
      },
      tags: {
        ...tags,
        ...(errorInfo?.boundaryName && { boundaryName: errorInfo.boundaryName }),
      },
      extra: {
        ...extra,
        ...(errorInfo && { errorInfo }),
      },
    }

    // Call beforeSend hook if provided
    const finalEvent = beforeSend ? beforeSend(event, error, errorInfo) : event

    if (!finalEvent) return

    // Send to Sentry via HTTP
    sendToSentry(dsn, finalEvent, environment)
  }
}

/**
 * Parse React component stack into Sentry frames
 */
function parseComponentStack(stack: string): Array<{
  filename: string
  lineno: number
  colno: number
  function: string
}> {
  const frames: Array<{
    filename: string
    lineno: number
    colno: number
    function: string
  }> = []

  const lines = stack.split('\n')
  for (const line of lines) {
    const match = line.match(/(?:at\s+)?(?:(.+?)\s+)?at\s+(?:(.+?):(\d+):(\d+))/)
    if (match) {
      frames.push({
        function: match[1] || 'unknown',
        filename: match[2] || 'unknown',
        lineno: parseInt(match[3]) || 0,
        colno: parseInt(match[4]) || 0,
      })
    }
  }

  return frames
}

/**
 * Send event to Sentry via HTTP API
 */
async function sendToSentry(dsn: string, event: SentryEvent, environment: string): Promise<void> {
  try {
    const url = new URL(`/api/${dsn.split('/')[1]}/store/`, `https://${dsn.split('@')[1]}`)
    
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': generateAuthHeader(dsn),
      },
      body: JSON.stringify({
        ...event,
        environment,
        timestamp: new Date().toISOString(),
        platform: 'javascript',
      }),
    })
  } catch {
    console.error('[react-error-utils] Failed to send error to Sentry')
  }
}

/**
 * Generate Sentry auth header
 */
function generateAuthHeader(dsn: string): string {
  const [publicKey, projectId] = dsn.split('/')
  const timestamp = Math.floor(Date.now() / 1000)
  return `Sentry sentry_version=7, sentry_client=react-error-utils/1.0, sentry_timestamp=${timestamp}, sentry_key=${publicKey}, sentry_project=${projectId}`
}

/**
 * Check if Sentry is available
 */
export function isSentryAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).SentryReact
}

/**
 * Get Sentry instance if available
 */
export function getSentry(): any {
  return (window as any).SentryReact
}
