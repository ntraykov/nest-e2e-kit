import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { DATABASE_CONNECTION } from '../../e2e-kit.tokens'
import { DatabaseConnection } from './connection.interface'

@Injectable()
export class DatabaseConnectionCleanup implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly connection: DatabaseConnection,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.connection.close()
  }
}
