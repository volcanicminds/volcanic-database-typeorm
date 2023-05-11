'use strict'

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as loaderEntities from './lib/loader/entities'
import * as userManager from './lib/loader/userManager'
import * as tokenManager from './lib/loader/tokenManager'
import { User } from './lib/entities/user'
import { Token } from './lib/entities/token'
import { applyQuery, executeCountQuery, executeFindQuery, useOrder, useWhere } from './lib/query'

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
      throw Error('Volcanic Database: options not specified')
    }

    const { LOG_DB_LEVEL = process.env.LOG_LEVEL || 'trace', LOG_COLORIZE = true } = process.env

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

    global.isLoggingEnabled = options?.logging || true
    const { classes, repositories, entities } = loaderEntities.load()
    options.entities = [...(options.entities || []), ...(entities || [])]
    options.logger = LOG_COLORIZE ? 'advanced-console' : 'simple-console'
    options.logging = logLevel

    // options.entities = [
    //   ...(options.entities || []),
    //   `${__dirname}/lib/entities/*.e.{ts,js}`,
    //   `${process.cwd()}/src/entities/*.e.{ts,js}`
    // ]

    return new DataSource(options)
      .initialize()
      .then(async (ds) => {
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
  applyQuery,
  executeCountQuery,
  executeFindQuery,
  useOrder,
  useWhere
}
