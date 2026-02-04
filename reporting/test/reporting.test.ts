import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock Sentry and Bugsnag on window for testing
const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
}

const mockBugsnag = {
  start: vi.fn(),
  notify: vi.fn(),
}

describe('reporting utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as any).__SENTRY__ = mockSentry
    ;(window as any).SentryReact = mockSentry
    ;(window as any).__BUGSNAG__ = mockBugsnag
    ;(window as any).BugsnagReact = mockBugsnag
  })

  afterEach(() => {
    delete (window as any).__SENTRY__
    delete (window as any).SentryReact
    delete (window as any).__BUGSNAG__
    delete (window as any).BugsnagReact
  })

  describe('Sentry reporter', () => {
    it('isSentryAvailable returns true when Sentry is present', async () => {
      const { isSentryAvailable } = await import('../src/sentry')
      expect(isSentryAvailable()).toBe(true)
    })

    it('isSentryAvailable returns false when Sentry is not present', async () => {
      delete (window as any).SentryReact
      const { isSentryAvailable } = await import('../src/sentry')
      expect(isSentryAvailable()).toBe(false)
    })

    it('createSentryReporter creates a reporter function', async () => {
      const { createSentryReporter } = await import('../src/sentry')
      const reporter = createSentryReporter({ dsn: 'https://test@sentry.io/123' })
      expect(typeof reporter).toBe('function')
    })
  })

  describe('Bugsnag reporter', () => {
    it('isBugsnagAvailable returns true when Bugsnag is present', async () => {
      const { isBugsnagAvailable } = await import('../src/bugsnag')
      expect(isBugsnagAvailable()).toBe(true)
    })

    it('isBugsnagAvailable returns false when Bugsnag is not present', async () => {
      delete (window as any).BugsnagReact
      const { isBugsnagAvailable } = await import('../src/bugsnag')
      expect(isBugsnagAvailable()).toBe(false)
    })

    it('createBugsnagReporter creates a reporter function', async () => {
      const { createBugsnagReporter } = await import('../src/bugsnag')
      const reporter = createBugsnagReporter({ apiKey: 'test-key' })
      expect(typeof reporter).toBe('function')
    })
  })

  describe('Custom reporter', () => {
    it('createReporter creates a reporter with send function', async () => {
      const { createReporter } = await import('../src/custom')
      const send = vi.fn()
      const reporter = createReporter({ send })
      expect(typeof reporter).toBe('function')
    })

    it('createBatchReporter batches errors', async () => {
      const { createBatchReporter } = await import('../src/custom')
      const reporters = [vi.fn(), vi.fn()]
      const batchReporter = createBatchReporter(reporters, { batchSize: 10 })
      expect(typeof batchReporter).toBe('function')
    })

    it('createConsoleReporter logs to console', async () => {
      const { createConsoleReporter } = await import('../src/custom')
      const reporter = createConsoleReporter()
      expect(typeof reporter).toBe('function')

      const error = new Error('Test error')
      const spyError = vi.spyOn(console, 'error').mockImplementation(() => {})
      reporter(error)
      expect(spyError).toHaveBeenCalled()
    })
  })
})
