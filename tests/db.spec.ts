import { describe, expect, it } from 'vitest'
import { DatabaseAssertionError } from '../src/database/database-assertion-error'

describe('DatabaseAssertionError', () => {
  it('sets name and message', () => {
    const error = new DatabaseAssertionError('test message')

    expect(error.name).toBe('DatabaseAssertionError')
    expect(error.message).toBe('test message')
  })

  it('includes details when provided', () => {
    const error = new DatabaseAssertionError('test message', { foo: 'bar' })

    expect(error.message).toContain('test message')
    expect(error.message).toContain('foo')
  })
})
