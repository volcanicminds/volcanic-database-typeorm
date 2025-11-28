/* eslint-disable no-useless-catch */
import * as log from '../util/logger.js'

export function isImplemented() {
  return true
}

export async function synchronizeSchemas() {
  try {
    await global.connection.synchronize()
    return true
  } catch (error) {
    throw error
  }
}

export async function retrieveBy(entityName, entityId) {
  try {
    return await global.entity[entityName].findOneById(entityId)
  } catch (error) {
    if (!(entityName in global.entity)) {
      log.error(`${entityName} not found in global.entity`)
    }
    throw error
  }
}

export async function addChange(entityName, entityId, status, userId, contents, changeEntity = 'Change') {
  try {
    const newChange = await global.entity[changeEntity].create({ entityName, entityId, status, userId, contents })
    return global.entity[changeEntity].save(newChange)
  } catch (error) {
    if (!(changeEntity in global.entity)) {
      log.error(`${changeEntity} not found in global.entity`)
    }
    throw error
  }
}
