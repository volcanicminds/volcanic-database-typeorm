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
@Unique(['username'])
@Unique(['email'])
@TableInheritance({ column: { type: 'varchar', name: 'type', default: 'user' } })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number

  @Index()
  @Column()
  username: string

  @Index()
  @Column()
  email: string

  @Column()
  password: string

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
