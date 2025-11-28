/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv'
dotenv.config()

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as loaderEntities from './lib/loader/entities.js'
import * as userManager from './lib/loader/userManager.js'
import * as tokenManager from './lib/loader/tokenManager.js'
import * as dataBaseManager from './lib/loader/dataBaseManager.js'
import { User } from './lib/entities/user.js'
import { Token } from './lib/entities/token.js'
import { Change } from './lib/entities/change.js'
import {
  applyQuery,
  executeCountQuery,
  executeCountView,
  executeFindQuery,
  executeFindView,
  useOrder,
  useWhere
} from './lib/query.js'
import * as log from './lib/util/logger.js'
import yn from './lib/util/yn.js'

async function start(options) {
  return new Promise<DataSource>((resolve, reject) => {
    if ((global as any).npmDebugServerStarted) {
      options = {
        type: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        username: 'vminds',
        password: 'vminds',
        database: 'vminds',
        synchronize: true,
        logging: true, // query, error, schema, warn, info, all
        logger: '' // advanced-console, simple-console
      }
    }

    if (options == null || Object.keys(options).length == 0) {
      throw new Error('Volcanic Database: options not specified')
    }

    const { LOG_DB_LEVEL = 'warn', LOG_COLORIZE = true, DB_SYNCHRONIZE_SCHEMA_AT_STARTUP = false } = process.env

    const logLevel: string | boolean =
      LOG_DB_LEVEL === 'trace'
        ? 'all'
        : LOG_DB_LEVEL === 'debug'
        ? 'query'
        : LOG_DB_LEVEL === 'info'
        ? 'info'
        : LOG_DB_LEVEL === 'warn'
        ? 'warn'
        : LOG_DB_LEVEL === 'error'
        ? 'error'
        : LOG_DB_LEVEL

    ;(global as any).cacheTimeout = options?.cacheTimeout || 30000 // milliseconds
    ;(global as any).isLoggingEnabled = options?.logging || true

    const { classes, repositories, entities } = loaderEntities.load()
    options.entities = [...(options.entities || []), ...(entities || [])]
    options.logger = LOG_COLORIZE ? 'advanced-console' : 'simple-console'
    options.logging = logLevel
    options.synchronize = false

    return new DataSource(options)
      .initialize()
      .then(async (ds) => {
        if (yn(DB_SYNCHRONIZE_SCHEMA_AT_STARTUP, false)) {
          log.warn('Database schema synchronization started')
          await ds.synchronize()
          log.warn('Database schema synchronization finished')
        }

        // load uselful stuff
        const repository = {}
        Object.keys(repositories).map((r) => (repository[r] = ds.getRepository(repositories[r])))
        ;(global as any).connection = ds
        ;(global as any).entity = classes
        ;(global as any).repository = repository
        return resolve(ds)
      })
      .catch((error) => reject(error))
  })
}

export { Database } from './types/global.js'
export {
  start,
  User,
  Token,
  Change,
  userManager,
  tokenManager,
  dataBaseManager,
  DataSource,
  applyQuery,
  executeCountQuery,
  executeCountView,
  executeFindQuery,
  executeFindView,
  useOrder,
  useWhere
}
