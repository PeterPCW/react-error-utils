# @react-error-utils/react19

React 19 specific features for error handling - RSC support and use() hook integration.

## Installation

```bash
npm install @react-error-utils/react19 @react-error-utils/core react@^19.0.0
# or
pnpm add @react-error-utils/react19 @react-error-utils/core react@^19.0.0
```

## Features

- **RSCErrorBoundary** - Error boundary for React Server Components
- **use() Hook Integration** - Handle promises with error boundaries
- **TypeScript First** - Full TypeScript support for React 19

## Quick Start

### RSCErrorBoundary

```tsx
import { RSCErrorBoundary } from '@react-error-utils/react19'

// For Server Components
<RSCErrorBoundary
  fallback={<ErrorDisplay />}
  onError={(error, info) => {
    console.error('RSC Error:', error, info)
  }}
>
  <ServerComponent />
</RSCErrorBoundary>
```

### use() with Error Boundaries

```tsx
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

## createErrorBoundary

Create a promise-based error boundary for use() hook:

```tsx
import { createErrorBoundary } from '@react-error-utils/react19'

function DataComponent({ promise }) {
  const [data, error, reset] = createErrorBoundary(promise)

  if (error) {
    return <ErrorDisplay error={error} onRetry={reset} />
  }

  if (!data) {
    return <Loading />
  }

  return <DataDisplay data={data} />
}
```

## License

MIT
