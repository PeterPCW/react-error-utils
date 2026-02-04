# @react-error-utils/hooks

Additional React error handling hooks - useErrorHandler and useRetry.

## Installation

```bash
npm install @react-error-utils/hooks @react-error-utils/core react
# or
pnpm add @react-error-utils/hooks @react-error-utils/core react
```

## Features

- **useErrorHandler** - Prop-based error handler for event handlers
- **useRetry** - Retry failed operations with configurable backoff
- **TypeScript First** - Full TypeScript support

## Quick Start

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

## API Reference

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

## License

MIT
