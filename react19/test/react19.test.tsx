import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { use } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createResource, useRequiredContext, createResourceResource, useResource, toResource } from '../src/useError'

describe('React 19 utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createResource', () => {
    it('returns data on successful fetch', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' })

      function TestComponent() {
        const [data, error] = createResource(fetcher)
        if (error) return <div>Error: {error.message}</div>
        if (!data) return <div>Loading</div>
        return <div>Data: {(data as any).data}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText('Data: test')).toBeInTheDocument()
      })
    })

    it('returns error on failed fetch', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'))

      function TestComponent() {
        const [data, error] = createResource(fetcher)
        if (error) return <div>Error: {error.message}</div>
        if (!data) return <div>Loading</div>
        return <div>Data: {(data as any)?.data}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText('Error: Fetch failed')).toBeInTheDocument()
      })
    })
  })

  describe('useRequiredContext', () => {
    it('throws error when context is null', () => {
      const TestContext = React.createContext<string | null>(null)

      function TestComponent() {
        const value = useRequiredContext(TestContext)
        return <div>Value: {value}</div>
      }

      expect(() => render(<TestComponent />)).toThrow('Context not provided')
    })

    it('returns context value when present', () => {
      const TestContext = React.createContext<string | null>(null)

      function TestComponent() {
        const value = useRequiredContext(TestContext, 'Custom error')
        return <div>Value: {value}</div>
      }

      render(
        <TestContext.Provider value="test-value">
          <TestComponent />
        </TestContext.Provider>
      )

      expect(screen.getByText('Value: test-value')).toBeInTheDocument()
    })
  })

  describe('createResourceResource', () => {
    it('creates a resource that can be read with use()', () => {
      const promise = Promise.resolve('success')
      const resource = createResourceResource(promise)

      expect(resource.status).toBe('pending')
      expect(resource.data).toBeNull()
      expect(resource.error).toBeNull()
    })
  })

  describe('toResource', () => {
    it('wraps a function to return a Resource', () => {
      const fetchData = vi.fn().mockResolvedValue({ result: 'ok' })
      const resourceFn = toResource(fetchData)

      expect(typeof resourceFn).toBe('function')
    })
  })
})
