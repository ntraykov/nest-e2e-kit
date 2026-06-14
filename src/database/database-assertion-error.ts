import { inspect } from 'node:util'

export class DatabaseAssertionError extends Error {
  constructor(message: string, details?: unknown) {
    super(
      details
        ? `${message}\n\n${inspect(details, { depth: 10, colors: true })}`
        : message,
    )

    this.name = 'DatabaseAssertionError'
  }
}
