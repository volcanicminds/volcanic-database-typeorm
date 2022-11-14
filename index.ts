'use strict'

import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as loaderEntities from './lib/loader/entities'

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

    const { classes, repositories, entities } = loaderEntities.load()
    options.entities = [...(options.entities || []), ...(entities || [])]
    options.logger = LOG_COLORIZE ? 'advanced-console' : 'simple-console'
    options.logging = logLevel
    // options.entities = [
    //   ...(options.entities || []),
    //   `${__dirname}/../entities/*.e.{ts,js}`,
    //   `${process.cwd()}/src/entities/*.e.{ts,js}`
    // ]

    new DataSource(options)
      .initialize()
      .then(async (ds) => {
        // load uselful stuff
        const repository = {}
        Object.keys(repositories).map((r) => (repository[r] = ds.getRepository(repositories[r])))

        global.database = {
          model: classes,
          repository: repository
        }

        return resolve(ds)
      })
      .catch((error) => reject(error))
  })
}

module.exports = start
module.exports.server = start
module.exports.default = start
