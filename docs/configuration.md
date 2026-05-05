# Configuration

The `@volcanicminds/typeorm` library provides several ways to customize its behavior through environment variables and initialization options.

## Initialization Options

You can pass an options object to the `start()` function to configure the database connection and library features.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sensitiveFields` | `string[]` | `['password', 'mfaSecret', 'resetPasswordToken', 'confirmationToken']` | A list of sensitive fields that should be blocked from filtering. |
| `cacheTimeout` | `number` | `30000` | The global cache timeout in milliseconds. |
| `logging` | `boolean` | `true` | Whether global logging is enabled. |
| ... | | | All other standard TypeORM initialization options. |

**Example:**

```typescript
import { start } from '@volcanicminds/typeorm'

await start({
  type: 'postgres',
  sensitiveFields: ['password', 'secretKey', 'ssn'], // Overrides default blacklist
  cacheTimeout: 60000,
  logging: false
})
```

## Environment Variables

You can also use environment variables to control specific features and logging behaviors.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `LOG_DB_LEVEL` | `string` | `'warn'` | Sets the logging level. Valid options: `trace`, `debug`, `info`, `warn`, `error`. Maps to TypeORM logging levels. |
| `LOG_COLORIZE` | `boolean` | `true` | Whether to colorize the console output. |
| `DB_SYNCHRONIZE_SCHEMA_AT_STARTUP` | `boolean` | `false` | Whether to synchronize the database schema at startup. **Note:** Ignored if multi-tenant mode is enabled. |
| `VOLCANIC_CUSTOM_QUERY_OPERATORS` | `boolean` | `false` | Enables custom query operators like `:raw`. ⚠️ **Dangerous**: Enabling this can introduce SQL injection vulnerabilities. Use with extreme caution. |
