# @react-error-utils/core

Core error boundary component and hook for React applications.

## Installation

```bash
npm install @react-error-utils/core react
# or
pnpm add @react-error-utils/core react
```

## Features

- **ErrorBoundary** - Component for catching and handling errors
- **useErrorBoundary** - Hook for function components
- **TypeScript First** - Full TypeScript support with strict types

## Quick Start

### ErrorBoundary Component

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

## License

MIT
