import { INestApplication } from '@nestjs/common'
import { DATABASE_CONNECTION } from '../e2e-kit.tokens'
import { DatabaseConnection } from './connection/connection.interface'
import { DatabaseAssertionError } from './database-assertion-error'

export function assertions(app: INestApplication) {
  const connection: DatabaseConnection = app.get(DATABASE_CONNECTION)

  const buildConditions = (fields: Record<string, string>) =>
    Object.keys(fields)
      .map(key => `\`${key}\` = ?`)
      .join(' AND ')

  const getValues = (fields: Record<string, string>) => Object.values(fields)

  const executeQuery = async (
    tableName: string,
    conditions: string,
    values: string[],
  ) =>
    connection.query(
      `SELECT * FROM \`${tableName}\` WHERE ${conditions}`,
      values,
    )

  const executeCountQuery = async (
    tableName: string,
    fields?: Record<string, string>,
  ): Promise<number> => {
    if (fields && Object.keys(fields).length > 0) {
      const conditions = buildConditions(fields)
      const values = getValues(fields)
      const results = await connection.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE ${conditions}`,
        values,
      )

      return Number((results[0] as { count: number }).count)
    }

    const results = await connection.query(
      `SELECT COUNT(*) as count FROM \`${tableName}\``,
    )

    return Number((results[0] as { count: number }).count)
  }

  const assertDatabaseHas = async (
    tableName: string,
    fields: Record<string, string>,
  ): Promise<void> => {
    const conditions = buildConditions(fields)
    const values = getValues(fields)

    const results = await executeQuery(tableName, conditions, values)

    if ((results as unknown[]).length === 0) {
      throw new DatabaseAssertionError(
        `Expected record in "${tableName}" matching ${JSON.stringify(fields)}`,
        { tableName, fields, results },
      )
    }
  }

  const assertDatabaseMissing = async (
    tableName: string,
    fields: Record<string, string>,
  ): Promise<void> => {
    const conditions = buildConditions(fields)
    const values = getValues(fields)

    const results = await executeQuery(tableName, conditions, values)

    if ((results as unknown[]).length > 0) {
      throw new DatabaseAssertionError(
        `Expected no record in "${tableName}" matching ${JSON.stringify(fields)}`,
        { tableName, fields, results },
      )
    }
  }

  const assertDatabaseEmpty = async (tableName: string): Promise<void> => {
    const count = await executeCountQuery(tableName)

    if (count > 0) {
      throw new DatabaseAssertionError(
        `Expected "${tableName}" to be empty, but found ${count} record(s)`,
        { tableName, count },
      )
    }
  }

  const assertDatabaseCount = async (
    tableName: string,
    expectedCount: number,
    fields?: Record<string, string>,
  ): Promise<void> => {
    const count = await executeCountQuery(tableName, fields)

    if (count !== expectedCount) {
      const scope = fields
        ? ` matching ${JSON.stringify(fields)}`
        : ''

      throw new DatabaseAssertionError(
        `Expected ${expectedCount} record(s) in "${tableName}"${scope}, but found ${count}`,
        { tableName, fields, expectedCount, count },
      )
    }
  }

  return {
    assertDatabaseHas,
    assertDatabaseMissing,
    assertDatabaseEmpty,
    assertDatabaseCount,
  }
}
