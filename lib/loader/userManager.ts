/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as bcrypt from 'bcrypt'
import * as Crypto from 'crypto'
import { ServiceError } from '../util/error.js'
import { executeCountQuery, executeFindQuery } from '../query.js'
import { encrypt, decrypt } from '../util/crypto.js'

export function isImplemented() {
  return true
}

export async function isValidUser(data: typeof global.entity.User) {
  return !!data && (!!data._id || !!data.id) && !!data.externalId && !!data.email && !!data.password
}

export async function createUser(data: typeof global.entity.User) {
  const { username, email, password } = data

  if (!email || !password) {
    throw new ServiceError('Invalid parameters', 400)
  }

  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)

  try {
    let externalId, user
    do {
      externalId = Crypto.randomUUID({ disableEntropyCache: true })

      user = await global.repository.users.findOneBy({ externalId: externalId })
    } while (user != null)

    user = await global.entity.User.create({
      ...data,
      passwordChangedAt: new Date(),
      confirmed: false,
      confirmationToken: Crypto.randomBytes(64).toString('hex'),
      blocked: false,
      blockedReason: null,
      externalId: externalId,
      email: email,
      username: username || email,
      password: hashedPassword,
      mfaEnabled: false,
      mfaSecret: null,
      mfaType: 'TOTP',
      mfaRecoveryCodes: []
    } as typeof global.entity.User)

    return await global.entity.User.save(user)
  } catch (error) {
    if (error?.code == 23505) {
      throw new ServiceError('Email or username already registered', 409)
    }
    throw error
  }
}

export async function deleteUser(id: string) {
  if (!id) {
    throw new ServiceError('Invalid parameters', 400)
  }

  try {
    const userEx = await retrieveUserById(id)
    if (!userEx) {
      throw new ServiceError('User not found', 404)
    }

    return global.entity.User.delete(id)
  } catch (error) {
    throw error
  }
}

export async function resetExternalId(id: string) {
  if (!id) {
    throw new ServiceError('Invalid parameters', 400)
  }

  try {
    let externalId, user
    do {
      externalId = Crypto.randomUUID({ disableEntropyCache: true })
      user = await global.repository.users.findOneBy({ externalId: externalId })
    } while (user != null)

    return await updateUserById(id, { externalId: externalId })
  } catch (error) {
    if (error?.code == 23505) {
      throw new ServiceError('External ID not changed', 409)
    }
    throw error
  }
}

export async function updateUserById(id: string, user: typeof global.entity.User) {
  if (!id || !user) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    const userEx = await retrieveUserById(id)
    if (!userEx) {
      throw new ServiceError('User not found', 404)
    }
    const merged = global.repository.users.merge(userEx, user)
    return await global.entity.User.save(merged)
  } catch (error) {
    throw error
  }
}

export async function retrieveUserById(id: string) {
  if (!id) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOneById(id)
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByEmail(email: string) {
  if (!email) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOneBy({ email: email })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByUsername(username: string) {
  if (!username) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOneBy({ username })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByConfirmationToken(code: string) {
  if (!code) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOneBy({ confirmationToken: code })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByResetPasswordToken(code: string) {
  if (!code) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOneBy({ resetPasswordToken: code })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByExternalId(externalId: string) {
  if (!externalId) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.repository.users.findOne({
      where: { externalId: externalId },
      cache: global.cacheTimeout
    })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByPassword(email: string, password: string) {
  if (!email || !password) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })
    if (!user) {
      throw new Error('Wrong credentials')
    }
    const match = await bcrypt.compare(password, user.password)
    return match ? user : null
  } catch (error) {
    throw error
  }
}

export async function changePassword(email: string, password: string, oldPassword: string) {
  if (!email || !password || !oldPassword) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })
    const match = await bcrypt.compare(oldPassword, user.password)
    if (match) {
      const salt = await bcrypt.genSalt(12)
      const hashedPassword = await bcrypt.hash(password, salt)
      return await global.entity.User.save({ ...user, passwordChangedAt: new Date(), password: hashedPassword })
    }
    throw new ServiceError('Password not changed', 400)
  } catch (error) {
    throw error
  }
}

export async function forgotPassword(email: string) {
  if (!email) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })

    if (user) {
      return await global.entity.User.save({
        ...user,
        resetPasswordTokenAt: new Date(),
        resetPasswordToken: Crypto.randomBytes(64).toString('hex')
      })
    }
    throw new ServiceError('Password not changed', 400)
  } catch (error) {
    throw error
  }
}

export async function resetPassword(user: typeof global.entity.User, password: string) {
  if (!user || !password || !user?.email) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    const userEx = await global.repository.users.findOneBy({ email: user.email })
    if (!userEx) {
      throw new Error('Wrong credentials')
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    return await global.entity.User.save({
      ...userEx,
      passwordChangedAt: new Date(),
      confirmed: true,
      confirmedAt: new Date(),
      resetPasswordToken: null,
      password: hashedPassword
    })
  } catch (error) {
    throw error
  }
}

export async function userConfirmation(user: typeof global.entity.User) {
  if (!user) {
    throw new ServiceError('Invalid parameters', 400)
  }
  try {
    return await global.entity.User.save({ ...user, confirmed: true, confirmedAt: new Date(), confirmationToken: null })
  } catch (error) {
    throw error
  }
}

export async function blockUserById(id: string, reason: string) {
  return updateUserById(id, { blocked: true, blockedAt: new Date(), blockedReason: reason })
}

export async function unblockUserById(id: string) {
  return updateUserById(id, { blocked: false, blockedAt: new Date(), blockedReason: null })
}

export function isPasswordToBeChanged(user: typeof global.entity.User) {
  if (process.env.PASSWORD_EXPIRATION_DAYS != null) {
    let passwordExpirationDays = -1
    try {
      passwordExpirationDays = Number(process.env.PASSWORD_EXPIRATION_DAYS)
      if (passwordExpirationDays <= 0) {
        throw new Error('PASSWORD_EXPIRATION_DAYS_ENV_INVALID')
      }
    } catch (e) {
      throw new Error(e)
    }
    const { passwordChangedAt } = user
    const date1 = new Date(passwordChangedAt)
    const date2 = new Date()
    const differenceInTime = date2.getTime() - date1.getTime()
    const differenceInDays = differenceInTime / (1000 * 3600 * 24)

    return differenceInDays >= passwordExpirationDays
  }

  return false
}

export async function countQuery(data: any) {
  return await executeCountQuery(global.repository.users, data)
}

export async function findQuery(data: any) {
  return await executeFindQuery(global.repository.users, {}, data)
}

export async function disableUserById(id: string) {
  await updateUserById(id, { blocked: true, blockedAt: new Date(), blockedReason: 'User disabled to unregister' })
  return resetExternalId(id)
}

// MFA Persistence Methods

export async function saveMfaSecret(userId: string, secret: string) {
  if (!userId || !secret) {
    throw new ServiceError('Invalid parameters', 400)
  }
  const encryptedSecret = encrypt(secret)

  await updateUserById(userId, {
    mfaSecret: encryptedSecret,
    mfaType: 'TOTP'
  })
  return true
}

export async function retrieveMfaSecret(userId: string) {
  if (!userId) throw new ServiceError('Invalid parameters', 400)

  const user = await global.repository.users
    .createQueryBuilder('user')
    .addSelect('user.mfaSecret')
    .where('user.id = :id', { id: userId })
    .getOne()

  if (!user || !user.mfaSecret) return null

  return decrypt(user.mfaSecret)
}

export async function enableMfa(userId: string) {
  if (!userId) throw new ServiceError('Invalid parameters', 400)
  return await updateUserById(userId, { mfaEnabled: true })
}

export async function disableMfa(userId: string) {
  if (!userId) throw new ServiceError('Invalid parameters', 400)
  return await updateUserById(userId, { mfaEnabled: false, mfaSecret: null, mfaRecoveryCodes: [] })
}

export async function forceDisableMfaForAdmin(email: string) {
  if (!email) return false

  const userRepo = global.repository.users

  const user = await userRepo.findOneBy({ email: email })
  if (!user) {
    return false
  }

  // Verify admin role (supports array of strings)
  const hasAdmin =
    user.roles && (user.roles.includes('admin') || user.roles.some((r) => r === 'admin' || r.code === 'admin'))

  if (!hasAdmin) {
    return false
  }

  await updateUserById(user.id, {
    mfaEnabled: false,
    mfaSecret: null,
    mfaRecoveryCodes: []
  })

  return true
}
