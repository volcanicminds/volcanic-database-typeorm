import { BaseEntity } from 'typeorm'

export abstract class User extends BaseEntity {
  abstract id: any
  abstract externalId: string
  abstract username: string
  abstract email: string
  abstract password: string
  abstract confirmed: boolean
  abstract confirmedAt: Date
  abstract blocked: boolean
  abstract blockedReason: string
  abstract blockedAt: Date
  abstract resetPasswordToken: string
  abstract confirmationToken: string
  abstract roles: string[]
  abstract version: number
  abstract createdAt: Date
  abstract updatedAt: Date
  abstract deletedAt: Date
}
