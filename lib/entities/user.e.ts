import {
  Entity,
  Column,
  TableInheritance,
  Index,
  Unique,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BaseEntity
} from 'typeorm'

@Entity()
@Unique(['externalId'])
@Unique(['username'])
@Unique(['email'])
@TableInheritance({ column: { type: 'varchar', name: 'type', default: 'user' } })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number

  @Index()
  @Column()
  externalId: string

  @Index()
  @Column()
  username: string

  @Index()
  @Column()
  email: string

  @Column()
  password: string

  @Column()
  enabled: boolean

  @Column()
  enabledAt: Date

  @Column({ type: 'simple-array', nullable: true })
  roles: string[]

  @VersionColumn()
  version: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
