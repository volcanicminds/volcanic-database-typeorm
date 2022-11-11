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
        logging: true
        // entities: []
        // subscribers: [],
        // migrations: []
      }
      console.log('options ' + JSON.stringify(options))
    }

    if (options == null || Object.keys(options).length == 0) {
      throw Error('Volcanic Database: options not specified')
    }

    // load all entities & classes
    const { classes, repositories, entities } = loaderEntities.load()
    options.entities = [...(options.entities || []), ...(entities || [])]

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
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

module.exports = start
module.exports.server = start
module.exports.default = start
