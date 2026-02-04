import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ErrorBoundary, useErrorBoundary, withErrorBoundary } from '../src'

describe('ErrorBoundary', () => {
  let consoleError: any
  
  beforeEach(() => {
    consoleError = console.error
    console.error = vi.fn()
  })
  
  afterEach(() => {
    console.error = consoleError
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <span>Hello World</span>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary fallback={<div>Caught!</div>}>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Caught!')).toBeInTheDocument()
  })

  it('calls onError when error occurs', () => {
    const onError = vi.fn()
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary fallback={<div>Caught!</div>} onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('calls onReset when resetBoundary is called', () => {
    const onReset = vi.fn()
    let boundaryRef: any = null

    function TestComponent() {
      const [showErr, setShowErr] = React.useState(false)

      return (
        <>
          <button data-testid="trigger" onClick={() => setShowErr(true)}>Trigger</button>
          <ErrorBoundary
            ref={(r: any) => (boundaryRef = r)}
            fallback={<div>Caught!</div>}
            onReset={onReset}
            onError={() => {}}
          >
            {showErr ? <ThrowError /> : <span>OK</span>}
          </ErrorBoundary>
          <button data-testid="reset" onClick={() => boundaryRef?.resetBoundary()}>Reset</button>
        </>
      )
    }

    function ThrowError() {
      throw new Error('Test error')
    }

    render(<TestComponent />)

    // Click trigger to cause error
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Caught!')).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()

    // Click reset to call resetBoundary
    fireEvent.click(screen.getByTestId('reset'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders function fallback with error and info', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    render(
      <ErrorBoundary 
        fallback={(error, info) => (
          <div>
            <span data-testid="error">{error.message}</span>
            <span data-testid="has-info">{info.componentStack ? 'yes' : 'no'}</span>
          </div>
        )}
      >
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('error')).toHaveTextContent('Test error')
    expect(screen.getByTestId('has-info')).toHaveTextContent('yes')
  })
})

describe('useErrorBoundary', () => {
  let consoleError: any
  
  beforeEach(() => {
    consoleError = console.error
    console.error = vi.fn()
  })
  
  afterEach(() => {
    console.error = consoleError
  })

  it('returns error state when not in boundary context', () => {
    function TestComponent() {
      const { showBoundary, error, hasError, resetBoundary } = useErrorBoundary()
      
      return (
        <div>
          <span data-testid="has-error">{hasError ? 'yes' : 'no'}</span>
          <span data-testid="error">{error?.message || 'no error'}</span>
          <button onClick={() => showBoundary(new Error('Test'))}>Throw</button>
          <button onClick={resetBoundary}>Reset</button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('has-error')).toHaveTextContent('no')
    expect(screen.getByTestId('error')).toHaveTextContent('no error')
  })

  it('shows error when showBoundary is called', () => {
    function TestComponent() {
      const { showBoundary, error, hasError } = useErrorBoundary()
      
      return (
        <div>
          <span data-testid="has-error">{hasError ? 'yes' : 'no'}</span>
          <span data-testid="error">{error?.message || 'no error'}</span>
          <button onClick={() => showBoundary(new Error('Test error'))}>Throw</button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    const button = screen.getByText('Throw')
    fireEvent.click(button)
    
    expect(screen.getByTestId('has-error')).toHaveTextContent('yes')
    expect(screen.getByTestId('error')).toHaveTextContent('Test error')
  })
})

describe('withErrorBoundary', () => {
  let consoleError: any
  
  beforeEach(() => {
    consoleError = console.error
    console.error = vi.fn()
  })
  
  afterEach(() => {
    console.error = consoleError
  })

  it('wraps component with error boundary', () => {
    const Component = () => {
      throw new Error('Test')
    }
    const Wrapped = withErrorBoundary(Component, <div>Error!</div>)
    
    render(<Wrapped />)
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })
})
