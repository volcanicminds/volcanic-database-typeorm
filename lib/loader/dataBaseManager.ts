/* eslint-disable no-useless-catch */
import { QueryRunner } from 'typeorm'
import * as log from '../util/logger.js'
import { ServiceError } from '../util/error.js'

export function isImplemented() {
  return true
}

export async function synchronizeSchemas() {
  // Block execution in multi-tenant mode to prevent partial schema updates
  if ((global as any).multiTenant?.enabled) {
    throw new ServiceError('Schema synchronization is not supported in multi-tenant mode.', 400)
  }

  try {
    await global.connection.synchronize()
    return true
  } catch (error) {
    throw error
  }
}

export async function retrieveBy(entityName: string, entityId: string, runner?: QueryRunner) {
  try {
    if (runner) {
      return await runner.manager.findOneBy(entityName, { id: entityId })
    }
    return await global.entity[entityName].findOneBy({ id: entityId })
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
  contents: any,
  changeEntity = 'Change',
  runner?: QueryRunner
) {
  try {
    if (runner) {
      const repo = runner.manager.getRepository(changeEntity)
      const newChange = repo.create({ entityName, entityId, status, userId, contents })
      return repo.save(newChange)
    }
    const newChange = await global.entity[changeEntity].create({ entityName, entityId, status, userId, contents })
    return global.entity[changeEntity].save(newChange)
  } catch (error) {
    if (!(changeEntity in global.entity)) {
      log.error(`Volcanic-TypeORM: ${changeEntity} not found in global.entity`)
    }
    throw error
  }
}
