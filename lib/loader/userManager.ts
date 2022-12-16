import * as bcrypt from 'bcrypt'
const { User } = require('../entities/user.e')

export async function demo() {
  // const users = await User.find()
  // return users || []
  return []
}

export async function register(data: typeof User) {
  const { name, email, password } = data
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)

  try {
    let user = { ...data, name: name || email, password: hashedPassword } as typeof User
    return await User.save(user)
  } catch (error) {
    if (error?.code == 23505) {
      throw Error('Email already registered')
    }
    throw error
  }
}

export async function login(data: typeof User) {
  const { email, password } = data

  try {
    const user = await global.repository.users.findOneBy({ email: email })
    const match = await bcrypt.compare(password, user.password)
    return match ? user : null
  } catch (error) {
    throw error
  }
}

export async function logout(data: typeof User) {}

export async function forgotPassword(data: typeof User) {}

export async function resetPassword(data: typeof User) {}

export async function unregister(data: typeof User) {}
