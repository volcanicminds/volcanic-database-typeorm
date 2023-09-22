'use strict'

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as loaderEntities from './lib/loader/entities'
import * as userManager from './lib/loader/userManager'
import * as tokenManager from './lib/loader/tokenManager'
import * as dataBaseManager from './lib/loader/dataBaseManager'
import { User } from './lib/entities/user'
import { Token } from './lib/entities/token'
import { applyQuery, executeCountQuery, executeFindQuery, useOrder, useWhere } from './lib/query'
import * as log from './lib/util/logger'
import yn from './lib/util/yn'

async function start(options) {
  return new Promise<DataSource>((resolve, reject) => {
    if (global.npmDebugServerStarted) {
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

    const {
      LOG_DB_LEVEL = process.env.LOG_LEVEL || 'trace',
      LOG_COLORIZE = true,
      DB_SYNCHRONIZE_SCHEMA_AT_STARTUP = false
    } = process.env

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
        : false

    global.cacheTimeout = options?.cacheTimeout || 30000 // milliseconds
    global.isLoggingEnabled = options?.logging || true

    const { classes, repositories, entities } = loaderEntities.load()
    options.entities = [...(options.entities || []), ...(entities || [])]
    options.logger = LOG_COLORIZE ? 'advanced-console' : 'simple-console'
    options.logging = logLevel
    options.synchronize = false

    // options.entities = [
    //   ...(options.entities || []),
    //   `${__dirname}/lib/entities/*.e.{ts,js}`,
    //   `${process.cwd()}/src/entities/*.e.{ts,js}`
    // ]

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

        global.connection = ds
        global.entity = classes
        global.repository = repository
        return resolve(ds)
      })
      .catch((error) => reject(error))
  })
}

export { Database } from './types/global'
export {
  start,
  User,
  Token,
  userManager,
  tokenManager,
  dataBaseManager,
  DataSource,
  applyQuery,
  executeCountQuery,
  executeFindQuery,
  useOrder,
  useWhere
}

module.exports = {
  start,
  User,
  Token,
  userManager,
  tokenManager,
  dataBaseManager,
  applyQuery,
  executeCountQuery,
  executeFindQuery,
  useOrder,
  useWhere
}
