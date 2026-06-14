import { type E2EKitConfiguration } from '../../e2e-kit.types'

export abstract class DatabaseConnection {
  constructor(protected readonly config: E2EKitConfiguration) {}

  abstract query(sql: string, values?: unknown[]): Promise<unknown[]>
  abstract close(): Promise<void>
}
