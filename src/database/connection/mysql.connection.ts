import { DatabaseConnection } from './connection.interface'
import mysql, { Connection } from 'mysql2/promise'
import type {
  E2EKitConfiguration,
  ParamsConfiguration,
} from '../../e2e-kit.types'

function isUriConfiguration(
  config: E2EKitConfiguration,
): config is E2EKitConfiguration & { uri: string } {
  return 'uri' in config
}

function isParamsConfiguration(
  config: E2EKitConfiguration,
): config is ParamsConfiguration {
  return 'host' in config
}

export class MySQLConnection extends DatabaseConnection {
  private conn?: Connection

  async query(sql: string, values: unknown[] = []): Promise<unknown[]> {
    const conn = await this.getConnection()
    const [results] =
      values.length > 0 ? await conn.query(sql, values) : await conn.query(sql)

    return results as unknown[]
  }

  async close(): Promise<void> {
    if (!this.conn) {
      return
    }

    await this.conn.end()
    this.conn = undefined
  }

  private async getConnection(): Promise<Connection> {
    if (this.conn) {
      return this.conn
    }

    if (isUriConfiguration(this.config)) {
      this.conn = await mysql.createConnection(this.config.uri)
    } else if (isParamsConfiguration(this.config)) {
      this.conn = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
      })
    } else {
      throw new Error('Unsupported database configuration')
    }

    return this.conn
  }
}
