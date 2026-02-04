# @react-error-utils/reporting

Error reporting utilities for Sentry and Bugsnag integration.

## Installation

```bash
npm install @react-error-utils/reporting @react-error-utils/core react
# or
pnpm add @react-error-utils/reporting @react-error-utils/core react
```

## Features

- **Sentry Integration** - Zero-config error reporting to Sentry
- **Bugsnag Integration** - Error and session tracking with Bugsnag
- **TypeScript First** - Full TypeScript support

## Quick Start

### Sentry Integration

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

### Bugsnag Integration

```tsx
import { createBugsnagReporter } from '@react-error-utils/reporting'

const bugsnagReporter = createBugsnagReporter({
  apiKey: 'your-api-key'
})

<ErrorBoundary onError={bugsnagReporter}>
  <App />
</ErrorBoundary>
```

## Advanced Usage

### With Custom Options

```tsx
const sentryReporter = createSentryReporter({
  dsn: process.env.SENTRY_DSN,
  beforeSend: (event) => {
    // Filter sensitive data
    return event
  },
  initialScope: {
    user: { id: user.id }
  }
})
```

## License

MIT
