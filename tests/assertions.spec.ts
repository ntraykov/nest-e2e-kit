import { describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { DATABASE_CONNECTION } from '../src/e2e-kit.tokens'
import { assertions } from '../src/database/assertions'
import { DatabaseAssertionError } from '../src/database/database-assertion-error'

function createApp(query: ReturnType<typeof vi.fn>): INestApplication {
  return {
    get: vi.fn((token: unknown) => {
      if (token === DATABASE_CONNECTION) {
        return { query, close: vi.fn() }
      }

      throw new Error(`Unexpected token: ${String(token)}`)
    }),
  } as unknown as INestApplication
}

describe('assertions', () => {
  describe('assertDatabaseEmpty', () => {
    it('passes when the table has no rows', async () => {
      const query = vi.fn().mockResolvedValue([{ count: 0 }])
      const { assertDatabaseEmpty } = assertions(createApp(query))

      await expect(assertDatabaseEmpty('users')).resolves.toBeUndefined()

      expect(query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM `users`',
      )
    })

    it('throws when the table has rows', async () => {
      const query = vi.fn().mockResolvedValue([{ count: 3 }])
      const { assertDatabaseEmpty } = assertions(createApp(query))

      await expect(assertDatabaseEmpty('users')).rejects.toBeInstanceOf(
        DatabaseAssertionError,
      )
    })
  })

  describe('assertDatabaseCount', () => {
    it('passes when the count matches without filters', async () => {
      const query = vi.fn().mockResolvedValue([{ count: 2 }])
      const { assertDatabaseCount } = assertions(createApp(query))

      await expect(assertDatabaseCount('users', 2)).resolves.toBeUndefined()
    })

    it('passes when the count matches with filters', async () => {
      const query = vi.fn().mockResolvedValue([{ count: 1 }])
      const { assertDatabaseCount } = assertions(createApp(query))

      await expect(
        assertDatabaseCount('users', 1, { status: 'active' }),
      ).resolves.toBeUndefined()

      expect(query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM `users` WHERE `status` = ?',
        ['active'],
      )
    })

    it('throws when the count does not match', async () => {
      const query = vi.fn().mockResolvedValue([{ count: 5 }])
      const { assertDatabaseCount } = assertions(createApp(query))

      await expect(assertDatabaseCount('users', 2)).rejects.toBeInstanceOf(
        DatabaseAssertionError,
      )
    })
  })
})
