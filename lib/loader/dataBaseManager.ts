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
