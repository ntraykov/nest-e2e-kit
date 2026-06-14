# nest-e2e-kit

Laravel-style database assertions for NestJS end-to-end tests.

When you write E2E tests, you often need to verify that an HTTP request actually changed the database - a user was created, an order was stored, a row was removed. This package gives you a small, focused API for that, wired into NestJS via a dynamic module.

## Why use this?

In Laravel, you write:

```php
$this->assertDatabaseHas('users', ['email' => 'john@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);
```

`nest-e2e-kit` brings the same idea to NestJS. Instead of reaching for your ORM inside tests (which couples assertions to your app's data layer), you query the database directly and get clear, framework-agnostic errors when expectations fail.

## Installation

```bash
npm install nest-e2e-kit
```

This package targets NestJS applications. `@nestjs/common` and `@nestjs/core` are listed as peer dependencies - npm will warn if they are missing, but a normal NestJS project already includes them. You do not need a separate install step.

## Quick start

### 1. Register the module in your E2E test setup

Import `E2EKitModule` alongside your app module and pass your test database config:

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { E2EKitModule } from 'nest-e2e-kit'
import { AppModule } from '../src/app.module'

let app: INestApplication

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppModule,
      E2EKitModule.forRoot({
        driver: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'secret',
        database: 'my_app_test',
      }),
    ],
  }).compile()

  app = moduleRef.createNestApplication()
  await app.init()
})

afterAll(async () => {
  await app.close()
})
```

You can also pass a connection URI:

```typescript
E2EKitModule.forRoot({
  driver: 'mysql',
  uri: 'mysql://root:secret@localhost:3306/my_app_test',
})
```

### 2. Use assertions in your tests

```typescript
import request from 'supertest'
import { assertions } from 'nest-e2e-kit'

describe('POST /users', () => {
  it('creates a user in the database', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'john@example.com', name: 'John' })
      .expect(201)

    const { assertDatabaseHas } = assertions(app)

    await assertDatabaseHas('users', {
      email: 'john@example.com',
      name: 'John',
    })
  })

  it('does not leave a deleted user in the database', async () => {
    await request(app.getHttpServer())
      .delete('/users/1')
      .expect(200)

    const { assertDatabaseMissing } = assertions(app)

    await assertDatabaseMissing('users', {
      id: '1',
    })
  })

  it('tracks how many active users exist', async () => {
    const { assertDatabaseCount } = assertions(app)

    await assertDatabaseCount('users', 3, { status: 'active' })
  })

  it('ensures a scratch table was cleaned up', async () => {
    const { assertDatabaseEmpty } = assertions(app)

    await assertDatabaseEmpty('temp_imports')
  })
})
```

## API

### `E2EKitModule.forRoot(config)`

Registers a database connection for use in E2E tests. The connection is automatically closed when the Nest application shuts down.

**Configuration** - choose one of two shapes:

| Field | Type | Description |
|-------|------|-------------|
| `driver` | `'mysql'` | Database driver (MySQL only for now) |
| `host` | `string` | Hostname (params config) |
| `port` | `number` | Port (params config) |
| `username` | `string` | Username (params config) |
| `password` | `string` | Password (params config) |
| `database` | `string` | Database name (params config) |
| `uri` | `string` | Full connection URI (alternative to params) |

### `assertions(app)`

Returns assertion helpers bound to the running Nest application.

#### `assertDatabaseHas(table, fields)`

Asserts that at least one row exists in `table` matching all `fields`.

```typescript
await assertDatabaseHas('orders', {
  user_id: '42',
  status: 'pending',
})
```

Throws `DatabaseAssertionError` if no matching row is found.

#### `assertDatabaseMissing(table, fields)`

Asserts that no row exists in `table` matching all `fields`.

```typescript
await assertDatabaseMissing('sessions', {
  token: 'expired-token',
})
```

Throws `DatabaseAssertionError` if a matching row is found.

#### `assertDatabaseEmpty(table)`

Asserts that a table contains no rows at all.

```typescript
await assertDatabaseEmpty('temp_imports')
```

Throws `DatabaseAssertionError` if the table has one or more rows.

#### `assertDatabaseCount(table, count, fields?)`

Asserts the number of rows in a table. An optional `fields` object filters the count, matching Laravel's `assertDatabaseCount`.

```typescript
await assertDatabaseCount('users', 5)
await assertDatabaseCount('orders', 2, { status: 'pending' })
```

Throws `DatabaseAssertionError` if the actual count differs from `count`.

## Error handling

Failed assertions throw `DatabaseAssertionError` with a descriptive message and diagnostic details:

```typescript
import { DatabaseAssertionError, assertions } from 'nest-e2e-kit'

const { assertDatabaseHas } = assertions(app)

try {
  await assertDatabaseHas('users', { email: 'missing@example.com' })
} catch (error) {
  if (error instanceof DatabaseAssertionError) {
    // error.message → human-readable failure reason
    // error details  → { tableName, fields, results }
  }
}
```

Works with any test runner (Jest, Vitest, Mocha) - no `expect()` globals required.

## How it works

```
E2E test
  │
  ├─ E2EKitModule.forRoot()     → registers a MySQL connection in DI
  │
  └─ assertions(app)            → resolves the connection from the app
        │
        ├─ assertDatabaseHas()       → SELECT ... WHERE field = ?
        ├─ assertDatabaseMissing()   → SELECT ... WHERE field = ?
        ├─ assertDatabaseEmpty()     → SELECT COUNT(*) ...
        └─ assertDatabaseCount()     → SELECT COUNT(*) ... WHERE field = ?
```

The module manages the connection lifecycle via `OnModuleDestroy`, so you don't need to clean up manually.

## Roadmap

- [x] `assertDatabaseCount`
- [x] `assertDatabaseEmpty`
- [ ] PostgreSQL support
- [ ] Additional E2E helpers (HTTP, fixtures)

## License

ISC
