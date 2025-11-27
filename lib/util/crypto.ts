import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const SECRET_KEY = process.env.MFA_DB_SECRET || process.env.JWT_SECRET || 'default_secret_must_be_changed_32b'
const IV_LENGTH = 16

function getKey() {
  return crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substr(0, 32)
}

export function encrypt(text: string): string {
  if (!text) return text
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getKey()), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  if (!text) return text
  const textParts = text.split(':')
  if (textParts.length < 2) return text // Return as is if not encrypted properly
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getKey()), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
