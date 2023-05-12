const Crypto = require('crypto')
import { executeCountQuery, executeFindQuery } from '../query'

export function isImplemented() {
  return true
}

export async function isValidToken(data: typeof global.entity.Token) {
  return !!data && (!!data._id || !!data.id) && !!data.externalId && !!data.name
}

export async function createToken(data: typeof global.entity.Token) {
  const { name, description } = data

  if (!name) {
    return null
  }

  try {
    let externalId, token
    do {
      externalId = Crypto.randomUUID({ disableEntropyCache: true })

      token = await global.repository.tokens.findOneBy({ externalId: externalId })
    } while (token != null)

    token = await global.entity.Token.create({
      ...data,
      name: name,
      description: description,
      blocked: false,
      blockedReason: null,
      externalId: externalId
    } as typeof global.entity.Token)

    return await global.entity.Token.save(token)
  } catch (error) {
    throw error
  }
}

export async function resetExternalId(id: string) {
  if (!id) {
    return null
  }

  try {
    let externalId, token
    do {
      externalId = Crypto.randomUUID({ disableEntropyCache: true })
      token = await global.repository.tokens.findOneBy({ externalId: externalId })
    } while (token != null)

    // TODO: use externalId instead id
    return await updateTokenById(id, { externalId: externalId })
  } catch (error) {
    if (error?.code == 23505) {
      throw new Error('External ID not changed')
    }
    throw error
  }
}

export async function updateTokenById(id: string, token: typeof global.entity.Token) {
  if (!id || !token) {
    return null
  }
  try {
    const tokenEx = await global.repository.tokens.findOneById(id)
    if (!tokenEx) {
      return null
    }
    const merged = global.repository.tokens.merge(tokenEx, token)
    return await global.entity.Token.save(merged)
  } catch (error) {
    throw error
  }
}

export async function retrieveTokenById(id: string) {
  if (!id) {
    return null
  }
  try {
    return await global.repository.tokens.findOneById(id)
  } catch (error) {
    throw error
  }
}

export async function retrieveTokenByExternalId(externalId: string) {
  if (!externalId) {
    return null
  }
  try {
    return await global.repository.tokens.findOneBy({ externalId: externalId })
  } catch (error) {
    throw error
  }
}

export async function blockTokenById(id: string, reason: string) {
  return updateTokenById(id, { blocked: true, blockedAt: new Date(), blockedReason: reason })
}

export async function unblockTokenById(id: string) {
  return updateTokenById(id, { blocked: false, blockedAt: new Date(), blockedReason: null })
}

export async function countQuery(data: any) {
  return await executeCountQuery(global.repository.tokens, data, {})
}

export async function findQuery(data: any) {
  return await executeFindQuery(global.repository.tokens, {}, data)
}

export async function removeTokenById(id: string) {
  if (!id) {
    return null
  }
  try {
    return await global.repository.tokens.delete(id)
  } catch (error) {
    throw error
  }
}
