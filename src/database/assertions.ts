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

  return {
    assertDatabaseHas,
    assertDatabaseMissing,
  }
}
