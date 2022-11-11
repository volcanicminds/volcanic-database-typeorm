[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![opensource](https://img.shields.io/badge/open-source-blue)](https://en.wikipedia.org/wiki/Open_source)
[![volcanic-backend](https://img.shields.io/badge/volcanic-minds-orange)](https://github.com/volcanicminds/volcanic-backend)
[![npm](https://img.shields.io/badge/package-npm-white)](https://www.npmjs.com/package/@volcanicminds/typeorm)

# volcanic-database-typeorm

## Based on

Based on [Fastify](https://www.fastify.io) ([GitHub](https://github.com/fastify/fastify)).

Based on [TypeORM](https://www.typeorm.io) ([GitHub](https://github.com/typeorm/typeorm)).

And, what you see in [package.json](package.json).

## How to install

```js
yarn add @volcanicminds/typeorm
```

## How to upgrade packages

```js
yarn upgrade-deps
```

## Postgres (data types)

[typeorm postgres: database schema / column types](https://github.com/typeorm/typeorm/blob/master/test/functional/database-schema/column-types/postgres/entity/Post.ts)

[postgres data types: all](https://www.postgresql.org/docs/current/datatype.html)
[postgres data types: numeric](https://www.postgresql.org/docs/current/datatype-numeric.html)

## Entities

For example, under `/src/entities` create the following:

```ts
// player.e.ts

import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
class Player {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column() // default: nullable false
  name: string

  @Column({ type: 'varchar', array: true, nullable: true })
  roles: string[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

module.exports = Player
```

For more info and possibilities see [typeorm decorators](https://typeorm.io/decorator-reference)

## Enviroment

```rb
# or automatically use LOG_LEVEL
LOG_DB_LEVEL=warn
LOG_COLORIZE=true
```

Log levels:

- **trace**: useful and useless messages, verbose mode
- **debug**: well, for debugging purposes.. you know what I mean
- **info**: minimal logs necessary for understand that everything is working fine
- **warn**: useful warnings if the environment is controlled
- **error**: print out errors even if not blocking/fatal errors
- **fatal**: ok you are dead now, but you want to know
