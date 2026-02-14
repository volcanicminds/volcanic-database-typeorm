import { QueryRunner } from 'typeorm'
import * as log from '../util/logger.js'

export function isImplemented() {
  return true
}

export async function synchronizeSchemas(runner?: QueryRunner) {
  try {
    if (runner) {
      await runner.connection.synchronize()
    } else {
      await global.connection.synchronize()
    }
    return true
  } catch (error) {
    log.error(`Volcanic-TypeORM: ${error}`)
    throw error
  }
}

export async function retrieveBy(entityName: string, entityId: string, runner?: QueryRunner) {
  try {
    if (runner) {
      return await runner.manager.findOneBy(entityName, { id: entityId })
    }
    return await global.connection.getRepository(global.entity[entityName]).findOneBy({ id: entityId })
  } catch (error) {
    if (!(entityName in global.entity)) {
      log.error(`Volcanic-TypeORM: ${entityName} not found in global.entity`)
    }
    throw error
  }
}

export async function addChange(
  entityName: string,
  entityId: string,
  status: string,
  userId: string,
  contents: unknown,
  changeEntity = 'Change',
  runner?: QueryRunner
) {
  try {
    if (runner) {
      const repo = runner.manager.getRepository(changeEntity)
      const newChange = repo.create({ entityName, entityId, status, userId, contents })
      return repo.save(newChange)
    }
    const repo = global.connection.getRepository(global.entity[changeEntity])
    const newChange = repo.create({ entityName, entityId, status, userId, contents })
    return repo.save(newChange)
  } catch (error) {
    if (!(changeEntity in global.entity)) {
      log.error(`Volcanic-TypeORM: ${changeEntity} not found in global.entity`)
    }
    throw error
  }
}
