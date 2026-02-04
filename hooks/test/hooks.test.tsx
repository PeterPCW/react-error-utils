import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useErrorHandler, useRetry } from '../src'

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles error and adds to history', () => {
    function TestComponent() {
      const { handleError, errors, latestError, clearErrors } = useErrorHandler()
      
      return (
        <div>
          <span data-testid="error-count">{errors.length}</span>
          <span data-testid="latest-error">{latestError?.message || 'none'}</span>
          <button onClick={() => handleError(new Error('Test error'))}>Handle Error</button>
          <button onClick={clearErrors}>Clear</button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    expect(screen.getByTestId('latest-error')).toHaveTextContent('none')
    
    fireEvent.click(screen.getByText('Handle Error'))
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    expect(screen.getByTestId('latest-error')).toHaveTextContent('Test error')
  })

  it('limits error history to maxErrors', () => {
    function TestComponent() {
      const { handleError, errors } = useErrorHandler({ maxErrors: 2 })
      
      return (
        <div>
          <span data-testid="error-count">{errors.length}</span>
          <button onClick={() => handleError(new Error('Error 1'))}>Error 1</button>
          <button onClick={() => handleError(new Error('Error 2'))}>Error 2</button>
          <button onClick={() => handleError(new Error('Error 3'))}>Error 3</button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    fireEvent.click(screen.getByText('Error 1'))
    fireEvent.click(screen.getByText('Error 2'))
    fireEvent.click(screen.getByText('Error 3'))
    
    expect(screen.getByTestId('error-count')).toHaveTextContent('2')
  })

  it('calls onError callback', () => {
    const onError = vi.fn()
    
    function TestComponent() {
      const { handleError } = useErrorHandler({ onError })
      
      return (
        <div>
          <button onClick={() => handleError(new Error('Test'))}>Handle</button>
        </div>
      )
    }
    
    render(<TestComponent />)
    fireEvent.click(screen.getByText('Handle'))
    
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
})

describe('useRetry', () => {
  it('executes function successfully', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')

    function TestComponent() {
      const { execute, isSuccess, isFailed, error } = useRetry(mockFn, {
        maxAttempts: 3,
        initialDelayMs: 0
      })

      return (
        <div>
          <span data-testid="success">{isSuccess ? 'yes' : 'no'}</span>
          <span data-testid="failed">{isFailed ? 'yes' : 'no'}</span>
          <span data-testid="error">{error?.message || 'none'}</span>
          <button onClick={() => execute()}>Execute</button>
        </div>
      )
    }

    render(<TestComponent />)

    fireEvent.click(screen.getByText('Execute'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('yes')
      expect(screen.getByTestId('failed')).toHaveTextContent('no')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  it('retries on failure then succeeds', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValue('success')

    function TestComponent() {
      const { execute, attempt, isSuccess } = useRetry(mockFn, {
        maxAttempts: 3,
        initialDelayMs: 10
      })

      return (
        <div>
          <span data-testid="attempt">{attempt}</span>
          <span data-testid="success">{isSuccess ? 'yes' : 'no'}</span>
          <button onClick={execute}>Execute</button>
        </div>
      )
    }

    render(<TestComponent />)

    fireEvent.click(screen.getByText('Execute'))

    // Wait for all retries and final success
    await waitFor(
      () => {
        expect(screen.getByTestId('success')).toHaveTextContent('yes')
      },
      { timeout: 5000 }
    )
  })
})
