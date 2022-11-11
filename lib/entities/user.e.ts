import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column('varchar', { array: true })
  roles: string[]
}

module.exports = User
