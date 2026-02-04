# @react-error-utils/testing

Testing utilities for React error boundary applications.

## Installation

```bash
npm install @react-error-utils/testing @react-error-utils/core @testing-library/react react react-dom
# or
pnpm add @react-error-utils/testing @react-error-utils/core @testing-library/react react react-dom
```

## Features

- **renderWithErrorBoundary** - Render components with error boundaries for testing
- **waitForError** - Wait for async errors to be caught
- **waitForErrorResolved** - Wait for error boundaries to reset
- **Testing Library Compatible** - Works with @testing-library/react

## Quick Start

### renderWithErrorBoundary

```tsx
import { renderWithErrorBoundary, waitForError, screen } from '@react-error-utils/testing'

it('catches errors', async () => {
  const { getByText } = renderWithErrorBoundary(
    <BuggyComponent />,
    { fallback: <div>Error caught!</div> }
  )

  await waitForError()
  expect(getByText('Error caught!')).toBeInTheDocument()
})
```

### Testing Async Errors

```tsx
import { renderWithErrorBoundary, waitForError } from '@react-error-utils/testing'

it('handles async errors', async () => {
  renderWithErrorBoundary(
    <AsyncErrorComponent />,
    { fallback: <div>Something went wrong</div> }
  )

  const error = await waitForError({ timeout: 5000 })
  expect(error.error.message).toBe('Async error')
})
```

### waitForErrorResolved

```tsx
import { renderWithErrorBoundary, waitForError, waitForErrorResolved } from '@react-error-utils/testing'

it('resets after error', async () => {
  const { getByText, getByRole } = renderWithErrorBoundary(
    <RetryableComponent />,
    { fallback: <div>Error!</div> }
  )

  // Trigger error
  fireEvent.click(getByText('Trigger Error'))
  await waitForError()

  // Reset
  fireEvent.click(getByText('Retry'))

  // Wait for reset
  await waitForErrorResolved()
  expect(getByRole('button')).toBeInTheDocument()
})
```

## API Reference

### renderWithErrorBoundary

```tsx
function renderWithErrorBoundary(
  ui: ReactNode,
  options: {
    fallback: React.ReactNode | ((error: Error, errorInfo: ErrorInfo) => React.ReactNode)
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
): {
  rerender: (newUi: ReactNode) => void
  unmount: () => void
  getCaughtError: () => { error: Error | null; errorInfo: ErrorInfo | null }
}
```

### waitForError

```tsx
async function waitForError(options?: {
  timeout?: number
  interval?: number
}): Promise<{ error: Error; errorInfo: ErrorInfo }>
```

## License

MIT
