import { DynamicModule, Module } from '@nestjs/common'
import { DATABASE_CONNECTION } from './e2e-kit.tokens'
import type { E2EKitConfiguration } from './e2e-kit.types'
import { DatabaseConnectionCleanup } from './database/connection/connection.cleanup'
import { MySQLConnection } from './database/connection/mysql.connection'

export type { E2EKitConfiguration } from './e2e-kit.types'

@Module({})
export class E2EKitModule {
  static forRoot(config: E2EKitConfiguration): DynamicModule {
    return {
      module: E2EKitModule,
      providers: [
        {
          provide: DATABASE_CONNECTION,
          useFactory: () => {
            return new MySQLConnection(config)
          },
        },
        DatabaseConnectionCleanup,
      ],
      exports: [DATABASE_CONNECTION],
    }
  }
}
