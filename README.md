[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![opensource](https://img.shields.io/badge/open-source-blue)](https://en.wikipedia.org/wiki/Open_source)
[![volcanic-typeorm](https://img.shields.io/badge/volcanic-minds-orange)](https://github.com/volcanicminds/volcanic-typeorm)
[![npm](https://img.shields.io/badge/package-npm-white)](https://www.npmjs.com/package/@volcanicminds/typeorm)

# volcanic-database-typeorm

## Based on

Based on [TypeORM](https://www.typeorm.io) ([GitHub](https://github.com/typeorm/typeorm)).

And, what you see in [package.json](package.json).

## How to install

```js
yarn add @volcanicminds/typeorm
```

It's possible use this module with module [`@volcanicminds/backend`](https://github.com/volcanicminds/volcanic-backend)

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
export class Player {
  @PrimaryGeneratedColumn('uuid')
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

## Query: Operators

It's possible use some operators:

| Operator   | Description                        | Datatypes     | Example              |
| ---------- | ---------------------------------- | ------------- | -------------------- |
| null       | Is null                            | all           | field:null=true      |
| notNull    | Not is null                        | all           | field:notNull=true   |
| in         | Included in an array               | all           | field:in=A,B,C       |
| nin        | Not included in an array           | all           | field:nin=A,B,C      |
| gt         | Greater than                       | numeric, date | field:gt=10          |
| ge         | Greater than or equals to          | numeric, date | field:ge=10          |
| lt         | Less than                          | numeric, date | field:lt=10          |
| le         | Less than or equals to             | numeric, date | field:le=10          |
| between    | Is between A and B                 | numeric, date | field:between=A,B    |
| like       | Like with wildcard %               | text          | field:like=va%ue     |
| contains   | Contains                           | text          | field:contains=alu   |
| ncontains  | Not contains                       | text          | field:ncontains=xyz  |
| starts     | Starts with                        | text          | field:starts=val     |
| ends       | Ends with                          | text          | field:ends=lue       |
| eq         | Equals to                          | all           | field:eq=value       |
| neq        | Not equals to                      | all           | field:neq=xyz        |
| likei      | Like with wildcard % (ignore-case) | text          | field:likei=va%ue    |
| containsi  | Contains (ignore-case)             | text          | field:containsi=alu  |
| ncontainsi | Not contains (ignore-case)         | text          | field:ncontainsi=xyz |
| startsi    | Starts with (ignore-case)          | text          | field:startsi=val    |
| endsi      | Ends with (ignore-case)            | text          | field:endsi=lue      |
| eqi        | Equals to (ignore-case)            | text          | field:eqi=value      |
| neqi       | Not equals to (ignore-case)        | text          | field:neqi=xyz       |

The expression `field=value` is equals to `field:eq=value`

**Pay attention**: Some datatypes, like UUID, are special types and have possibility to use only specific operator (for example: eq, null, notNull, ..)

## Logging

Use Pino logger if in your project you have a `global.log` with a valid instance.
