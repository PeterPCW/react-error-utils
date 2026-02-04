/**
 * Bugsnag Reporter for @react-error-utils
 * Zero-config Bugsnag integration
 */

import type { ErrorInfo } from '@react-error-utils/core'

export interface BugsnagReporterOptions {
  apiKey: string
  appVersion?: string
  stage?: 'development' | 'production' | 'staging'
  beforeSend?: (report: BugsnagReport, error: Error, errorInfo?: ErrorInfo) => void
  metadata?: Record<string, Record<string, any>>
}

export interface BugsnagReport {
  error: {
    message: string
    stacktrace: Array<{
      file: string
      lineNumber: number
      columnNumber: number
      methodName: string
      inProject: boolean
    }>
  }
  metaData: Record<string, any>
  severity: 'warning' | 'error' | 'info'
}

/**
 * Create a Bugsnag reporter function
 * 
 * @example
 * ```tsx
 * import { createBugsnagReporter } from '@react-error-utils/reporting'
 * 
 * const bugsnagReporter = createBugsnagReporter({
 *   apiKey: 'your-api-key'
 * })
 * 
 * <ErrorBoundary onError={bugsnagReporter}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export function createBugsnagReporter(options: BugsnagReporterOptions) {
  const { apiKey, appVersion, stage = 'production', beforeSend, metadata = {} } = options

  /**
   * Create the error reporter function
   */
  return function bugsnagReporter(error: Error, errorInfo?: ErrorInfo): void {
    // Check if @bugsnag/react is available
    if (typeof window !== 'undefined') {
      try {
        const BugsnagReact = (window as any).BugsnagReact
        if (BugsnagReact) {
          BugsnagReact.notify(error, {
            ...errorInfo,
            beforeSend: beforeSend?.bind(null),
          })
          return
        }
      } catch {
        // Continue with manual reporting
      }
    }

    // Manual event creation
    const report: BugsnagReport = {
      error: {
        message: error.message,
        stacktrace: parseStackTrace(error, errorInfo),
      },
      metaData: {
        ...metadata,
        react: {
          ...(errorInfo && {
            componentStack: errorInfo.componentStack,
            boundaryName: errorInfo.boundaryName,
          }),
        },
      },
      severity: 'error',
    }

    // Call beforeSend hook if provided
    if (beforeSend) {
      beforeSend(report, error, errorInfo)
    }

    // Send to Bugsnag via HTTP
    sendToBugsnag(apiKey, report, appVersion, stage)
  }
}

/**
 * Parse error and component stack into Bugsnag stacktrace
 */
function parseStackTrace(error: Error, errorInfo?: ErrorInfo): Array<{
  file: string
  lineNumber: number
  columnNumber: number
  methodName: string
  inProject: boolean
}> {
  const stacktrace: Array<{
    file: string
    lineNumber: number
    columnNumber: number
    methodName: string
    inProject: boolean
  }> = []

  // Parse error stack
  if (error.stack) {
    const lines = error.stack.split('\n')
    for (const line of lines) {
      const match = line.match(/at\s+(?:(.+?)\s+)?\(?(?:(.+?):(\d+):(\d+))?\)?/)
      if (match) {
        stacktrace.push({
          methodName: match[1] || 'anonymous',
          file: match[2] || 'unknown',
          lineNumber: parseInt(match[3]) || 0,
          columnNumber: parseInt(match[4]) || 0,
          inProject: !match[2]?.includes('node_modules'),
        })
      }
    }
  }

  // Add component stack if available
  if (errorInfo?.componentStack) {
    const lines = errorInfo.componentStack.split('\n')
    for (const line of lines) {
      const match = line.match(/(?:at\s+)?(?:(.+?)\s+)?at\s+(?:(.+?):(\d+):(\d+))/)
      if (match) {
        stacktrace.push({
          methodName: match[1] || 'Component',
          file: match[2] || 'unknown',
          lineNumber: parseInt(match[3]) || 0,
          columnNumber: parseInt(match[4]) || 0,
          inProject: !match[2]?.includes('node_modules'),
        })
      }
    }
  }

  return stacktrace
}

/**
 * Send report to Bugsnag via HTTP API
 */
async function sendToBugsnag(
  apiKey: string,
  report: BugsnagReport,
  appVersion?: string,
  stage?: string
): Promise<void> {
  try {
    await fetch(`https://notify.bugsnag.com/js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        notifier: {
          name: 'react-error-utils',
          version: '1.0.0',
          url: 'https://github.com/peterwsl/react-error-utils',
        },
        events: [
          {
            payloadVersion: '5',
            exceptions: [
              {
                errorClass: 'Error',
                message: report.error.message,
                stacktrace: report.error.stacktrace,
              },
            ],
            severity: report.severity,
            app: {
              version: appVersion,
              releaseStage: stage,
            },
            metaData: report.metaData,
            device: {
              time: new Date().toISOString(),
            },
          },
        ],
      }),
    })
  } catch {
    console.error('[react-error-utils] Failed to send error to Bugsnag')
  }
}

/**
 * Create a custom reporter for any error tracking service
 */
export function createCustomReporter<T = any>({
  send,
  transform,
}: {
  send: (event: T) => Promise<void> | void
  transform?: (error: Error, errorInfo?: ErrorInfo) => T
}): (error: Error, errorInfo?: ErrorInfo) => void {
  return function customReporter(error: Error, errorInfo?: ErrorInfo): void {
    const event = transform ? transform(error, errorInfo) : { error, errorInfo } as any
    send(event)
  }
}

/**
 * Check if Bugsnag is available
 */
export function isBugsnagAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).BugsnagReact
}
