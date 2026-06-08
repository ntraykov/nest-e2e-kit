import type { EntityManager, EntityName, FilterQuery } from '@mikro-orm/core'
import { DatabaseAssertionError } from './database-assertion-error'

export async function assertDatabaseMissing<Entity extends object>(
  em: EntityManager,
  entity: EntityName<Entity>,
  where: FilterQuery<NoInfer<Entity>>,
): Promise<void> {
  const record = await em.findOne(entity, where)

  if (record) {
    throw new DatabaseAssertionError(
      'Expected database not to contain a matching record.',
      {
        entity,
        where,
        found: record,
      },
    )
  }
}
