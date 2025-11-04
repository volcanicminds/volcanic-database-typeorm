const bcrypt = require('bcrypt')

async function generateHash() {
  const password = process.argv[2]
  const saltRounds = 12

  if (!password) {
    console.error('Usage: node generate-hash.js <password_to_hash>')
    process.exit(1)
  }

  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log(`Password ${password}`)
    console.log(`Hash ${hash}`)
  } catch (error) {
    console.error('Error generating hash:', error)
  }
}

generateHash()
