import {
  Entity,
  Column,
  TableInheritance,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BaseEntity
} from 'typeorm'

export class ExtraColumns {
  @VersionColumn()
  version: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type', default: 'user' } })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number

  @Column(() => ExtraColumns)
  extra: ExtraColumns

  @Index()
  @Column()
  name: string // username

  @Index()
  @Column()
  email: string

  @Column()
  password: string

  @Column({ type: 'simple-array', nullable: true })
  allRoles: string[]
}
