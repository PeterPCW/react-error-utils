import { describe, it, expect } from 'vitest'
import { renderWithErrorBoundary, createErrorInfo, createMockError } from '../src'

describe('renderWithErrorBoundary', () => {
  it('creates error info', () => {
    const info = createErrorInfo('component stack', 'Boundary1')
    expect(info.componentStack).toBe('component stack')
    expect(info.boundaryName).toBe('Boundary1')
  })

  it('creates mock error', () => {
    const error = createMockError('Test error')
    expect(error.message).toBe('Test error')
  })
})
