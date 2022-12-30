import { BaseEntity } from 'typeorm'

export abstract class User extends BaseEntity {
  abstract id: any
  abstract externalId: string
  abstract username: string
  abstract email: string
  abstract password: string
  abstract enabled: boolean
  abstract enabledAt: Date
  abstract roles: string[]
  abstract version: number
  abstract createdAt: Date
  abstract updatedAt: Date
  abstract deletedAt: Date
}
