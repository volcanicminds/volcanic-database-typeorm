import * as bcrypt from 'bcrypt'
const { User } = require('../entities/user.e')

export async function demo() {
  // const users = await User.find()
  // return users || []
  return []
}

export async function register(data: typeof User) {
  const { name, email, password } = data
  const salt = await bcrypt.genSalt()
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
  const { name, email, password } = data

  try {
    const user = await global.repository.users.findOneBy({ email: email })
    return user
  } catch (error) {
    throw error
  }
}
