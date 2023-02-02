import * as bcrypt from 'bcrypt'
const Crypto = require('crypto')

export async function isValidUser(data: typeof global.entity.User) {
  return !!data && (!!data._id || !!data.id) && !!data.externalId && !!data.email && !!data.password
}

export async function createUser(data: typeof global.entity.User) {
  const { username, email, password } = data

  if (!email || !password) {
    return null
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
      confirmed: false,
      confirmationToken: Crypto.randomBytes(64).toString('hex'),
      blocked: false,
      blockedReason: null,
      externalId: externalId,
      email: email,
      username: username || email,
      password: hashedPassword
    } as typeof global.entity.User)

    return await global.entity.User.save(user)
  } catch (error) {
    if (error?.code == 23505) {
      throw Error('Email or username already registered')
    }
    throw error
  }
}

export async function resetExternalId(id: string) {
  if (!id) {
    return null
  }

  try {
    let externalId, user
    do {
      externalId = Crypto.randomUUID({ disableEntropyCache: true })
      user = await global.repository.users.findOneBy({ externalId: externalId })
    } while (user != null)

    // TODO: use externalId instead id
    return await updateUserById(id, { externalId: externalId })
  } catch (error) {
    if (error?.code == 23505) {
      throw Error('External ID not changed')
    }
    throw error
  }
}

export async function updateUserById(id: string, user: typeof global.entity.User) {
  if (!id || !user) {
    return null
  }
  try {
    const userEx = await global.repository.users.findOneById(id)
    if (!userEx) {
      return null
    }
    const merged = global.repository.users.merge(userEx, user)
    return await global.entity.User.save(merged)
  } catch (error) {
    throw error
  }
}

export async function retrieveUserById(id: string) {
  if (!id) {
    return null
  }
  try {
    return await global.repository.users.findOneById(id)
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByEmail(email: string) {
  if (!email) {
    return null
  }
  try {
    return await global.repository.users.findOneBy({ email: email })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByExternalId(externalId: string) {
  if (!externalId) {
    return null
  }
  try {
    return await global.repository.users.findOneBy({ externalId: externalId })
  } catch (error) {
    throw error
  }
}

export async function retrieveUserByPassword(email: string, password: string) {
  if (!email || !password) {
    return null
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })
    if (!user) {
      // console.log('retrieveUserByPassword before ' + user)
      return null
    }
    const match = await bcrypt.compare(password, user.password)
    // console.log('retrieveUserByPassword matched ' + match + ' password ' + password + ' email ' + email)
    return match ? user : null
  } catch (error) {
    // console.log('retrieveUserByPassword ' + error)
    throw error
  }
}

export async function changePassword(email: string, password: string, oldPassword: string) {
  if (!email || !password || !oldPassword) {
    return null
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })
    const match = await bcrypt.compare(oldPassword, user.password)
    if (match) {
      const salt = await bcrypt.genSalt(12)
      const hashedPassword = await bcrypt.hash(password, salt)
      return await global.entity.User.save({ ...user, password: hashedPassword })
    }
    return null
  } catch (error) {
    throw error
  }
}

export async function forgotPassword(email: string) {
  if (!email) {
    return null
  }
  try {
    const user = await global.repository.users.findOneBy({ email: email })
    if (user) {
      return await global.entity.User.save({ ...user, resetPasswordToken: Crypto.randomBytes(64).toString('hex') })
    }
    return null
  } catch (error) {
    throw error
  }
}

export async function resetPassword(user: typeof global.entity.User, password: string) {
  if (!user || !password) {
    return null
  }
  try {
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    return await global.entity.User.save({
      ...user,
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
    return null
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
