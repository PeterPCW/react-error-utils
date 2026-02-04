/**
 * Testing module entry point
 * Export all testing utilities
 */

export {
  renderWithErrorBoundary,
  createErrorInfo,
  createMockError,
  expectToThrow,
  simulateComponentStack,
  MockErrorBoundary,
  createErrorAssertion,
  type RenderWithErrorBoundaryOptions,
  type ErrorInfo,
} from './renderWithErrorBoundary'

export {
  waitForError,
  waitForErrorResolved,
  getCurrentError,
  clearCurrentError,
  simulateError,
  createTestError,
  expectThrows,
  expectNotThrows,
  type WaitForErrorOptions,
} from './waitForError'
