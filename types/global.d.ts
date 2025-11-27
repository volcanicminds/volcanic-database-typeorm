export interface Database {
  default: any
  [option: string]: any
}

export interface UserManagement {
  isImplemented(): boolean
  isValidUser(data: any): boolean
  createUser(data: any): any | null
  deleteUser(data: any): any | null
  resetExternalId(data: any): any | null
  updateUserById(id: string, user: any): any | null
  retrieveUserById(id: string): any | null
  retrieveUserByEmail(email: string): any | null
  retrieveUserByResetPasswordToken(code: string): any | null
  retrieveUserByConfirmationToken(code: string): any | null
  retrieveUserByUsername(username: string): any | null
  retrieveUserByExternalId(externalId: string): any | null
  retrieveUserByPassword(email: string, password: string): any | null
  changePassword(email: string, password: string, oldPassword: string): any | null
  forgotPassword(email: string): any | null
  resetPassword(user: any, password: string): any | null
  userConfirmation(user: any)
  blockUserById(id: string, reason: string): any | null
  unblockUserById(id: string): any | null
  countQuery(data: any): any | null
  findQuery(data: any): any | null
  disableUserById(id: string): any | null

  // MFA Persistence Methods
  saveMfaSecret(userId: string, secret: string): Promise<boolean>
  retrieveMfaSecret(userId: string): Promise<string | null>
  enableMfa(userId: string): Promise<boolean>
  disableMfa(userId: string): Promise<boolean>
}

export interface TokenManagement {
  isImplemented(): boolean
  isValidToken(data: any): boolean
  createToken(data: any): any | null
  resetExternalId(id: string): any | null
  updateTokenById(id: string, token: any): any | null
  retrieveTokenById(id: string): any | null
  retrieveTokenByExternalId(id: string): any | null
  blockTokenById(id: string, reason: string): any | null
  unblockTokenById(id: string): any | null
  countQuery(data: any): any | null
  findQuery(data: any): any | null
  removeTokenById(id: string): any | null
}

export interface DataBaseManagement {
  isImplemented(): boolean
  synchronizeSchemas(): any | null
  retrieveBy(entityName, entityId): any | null
  addChange(entityName, entityId, status, userId, contents, changeEntity): any | null
}
