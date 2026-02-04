# @react-error-utils

Comprehensive React error handling library with hooks API, retry mechanisms, error reporting, and React 19 support.

[![NPM Package](https://img.shields.io/npm/v/react-error-utils.svg)](https://www.npmjs.com/package/react-error-utils)
[![NPM Downloads](https://img.shields.io/npm/dm/react-error-utils.svg)](https://www.npmjs.com/package/react-error-utils)
[![License](https://img.shields.io/npm/l/react-error-utils.svg)](LICENSE)

## Features

- **Hooks-First API** - Modern hooks-based error handling for function components
- **TypeScript First** - Full TypeScript support with strict types
- **ErrorBoundary Component** - Class-component compatible with React 19
- **Retry Utilities** - Built-in retry with exponential backoff
- **Error Reporting** - Zero-config Sentry/Bugsnag integration
- **Testing Utilities** - Easy error boundary testing
- **React 19 Support** - RSC and use() hook integration

## Installation

```bash
npm install @react-error-utils/core @react-error-utils/hooks
# or
pnpm add @react-error-utils/core @react-error-utils/hooks
# or
yarn add @react-error-utils/core @react-error-utils/hooks
```

## Quick Start

### Basic ErrorBoundary

```tsx
import { ErrorBoundary } from '@react-error-utils/core'

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong!</div>}
      onError={(error, errorInfo) => {
        console.error('Error:', error)
        console.error('Info:', errorInfo)
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### useErrorBoundary Hook

```tsx
import { useErrorBoundary } from '@react-error-utils/core'

function MyComponent() {
  const { showBoundary, error, reset } = useErrorBoundary()

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => reset()}>Try again</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        throw new Error('Intentional error')
      }}
    >
      Trigger Error
    </button>
  )
}
```

### useErrorHandler

```tsx
import { useErrorHandler } from '@react-error-utils/hooks'

function MyComponent() {
  const handleError = useErrorHandler()

  const fetchData = async () => {
    try {
      const data = await fetch('/api/data')
      return data
    } catch (error) {
      handleError(error)
    }
  }

  return <button onClick={fetchData}>Fetch Data</button>
}
```

### useRetry with Backoff

```tsx
import { useRetry } from '@react-error-utils/hooks'

function DataFetcher({ url }) {
  const { data, loading, error, retry } = useRetry(
    () => fetch(url).then(r => r.json()),
    {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  )

  if (loading) return <Spinner />
  if (error) return <button onClick={retry}>Retry</button>

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

## Packages

### @react-error-utils/core

Core error boundary and hook.

```bash
npm install @react-error-utils/core
```

Exports:
- `ErrorBoundary` - Component for catching errors
- `useErrorBoundary` - Hook for function components
- `useErrorInfo` - Get error boundary info
- Types for all exports

### @react-error-utils/hooks

Additional hooks utilities.

```bash
npm install @react-error-utils/hooks
```

Exports:
- `useErrorHandler` - Prop-based error handler
- `useRetry` - Retry with backoff
- `useErrorInfo` - Extended error info

### @react-error-utils/reporting

Sentry/Bugsnag integration.

```bash
npm install @react-error-utils/reporting
```

```tsx
import { createSentryReporter } from '@react-error-utils/reporting'

// Zero-config Sentry integration
const sentryReporter = createSentryReporter({
  dsn: 'https://your-dsn@sentry.io/1234567'
})

// Use with ErrorBoundary
<ErrorBoundary onError={sentryReporter}>
  <App />
</ErrorBoundary>
```

### @react-error-utils/testing

Testing utilities.

```bash
npm install @react-error-utils/testing
```

```tsx
import { renderWithErrorBoundary, waitForError } from '@react-error-utils/testing'

it('catches errors', async () => {
  const { getByText } = renderWithErrorBoundary(
    <BuggyComponent />,
    <div>Error caught!</div>
  )

  await waitForError()
  expect(getByText('Error caught!')).toBeInTheDocument()
})
```

### @react-error-utils/react19

React 19 specific features.

```bash
npm install @react-error-utils/react19
```

```tsx
import { RSCErrorBoundary } from '@react-error-utils/react19'

// For Server Components
<RSCErrorBoundary fallback={<Error />}>
  <ServerComponent />
</RSCErrorBoundary>
```

## API Reference

### ErrorBoundary Props

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode)
  fallbackRender?: (props: { error: Error; reset: () => void }) => React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: (details: { reason: 'imperative' | 'props', error: Error }) => void
}
```

### useErrorBoundary Return

```tsx
interface UseErrorBoundaryReturn {
  error: Error | null
  reset: () => void
  showBoundary: (error: Error) => void
}
```

### useRetry Options

```tsx
interface UseRetryOptions<T> {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (error: Error, attempt: number) => void
  retryCondition?: (error: Error) => boolean
}
```

## Sentry Integration

```tsx
import { createSentryReporter } from '@react-error-utils/reporting'

const reporter = createSentryReporter({
  dsn: process.env.SENTRY_DSN,
  beforeSend: (event) => {
    // Filter sensitive data
    return event
  }
})

<ErrorBoundary onError={reporter}>
  <App />
</ErrorBoundary>
```

## TypeScript

Full strict type support:

```tsx
import { ErrorBoundary, useErrorBoundary } from '@react-error-utils/core'

// Type-safe error boundary
function TypedComponent() {
  const { showBoundary, error } = useErrorBoundary<MyErrorType>()

  if (error instanceof MyErrorType) {
    // TypeScript knows this is MyErrorType
    console.log(error.specificProperty)
  }
}
```

## Migration from react-error-boundary

```tsx
// Old
import { ErrorBoundary } from 'react-error-boundary'

// New
import { ErrorBoundary } from '@react-error-utils/core'

// API is compatible - minimal changes needed
```

## React 19 Support

```tsx
// Using use() hook with ErrorBoundary
import { use } from 'react'
import { useErrorBoundary } from '@react-error-utils/core'

function AsyncData({ promise }) {
  const { showBoundary } = useErrorBoundary()

  try {
    const data = use(promise)
    return <DataDisplay data={data} />
  } catch (error) {
    showBoundary(error)
  }
}
```

## License

MIT
