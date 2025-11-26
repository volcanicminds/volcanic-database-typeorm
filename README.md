[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![opensource](https://img.shields.io/badge/open-source-blue)](https://en.wikipedia.org/wiki/Open_source)
[![volcanic-typeorm](https://img.shields.io/badge/volcanic-minds-orange)](https://github.com/volcanicminds/volcanic-typeorm)
[![npm](https://img.shields.io/badge/package-npm-white)](https://www.npmjs.com/package/@volcanicminds/typeorm)

# volcanic-database-typeorm

`@volcanicminds/typeorm` is a powerful utility library for TypeORM that dynamically translates HTTP query string parameters into complex pagination, sorting, and filtering queries. It offers a database-agnostic abstraction layer, enabling seamless operation with both SQL (e.g., PostgreSQL) and NoSQL (e.g., MongoDB) databases for most common use cases.

## ⚠️ Breaking Changes in v2.x

- Change package manager from yarn to npm.
- Updated all dependencies to their latest versions.
- Increase minimum Node.js version to 24.x.
- Switched to pure ECMAScript Modules (`NodeNext`). CommonJS/`require` is no longer supported.
- Introduced support for complex boolean logic in filtering using the `_logic` parameter.
- Enhanced filtering capabilities with additional operators and nested relation queries.

## Based on

Based on [TypeORM](https://www.typeorm.io) ([GitHub](https://github.com/typeorm/typeorm)).

And, what you see in [package.json](package.json).

## Core Features

- **Server-Side Pagination**: Effortlessly handle large datasets by using `page` and `pageSize` parameters.
- **Multi-Field Sorting**: Easily define complex sorting orders directly from the URL.
- **Advanced Dynamic Filtering**: Go beyond simple equality checks with a rich set of filter operators.
- **Nested Relation Queries**: Filter and sort based on fields of related entities using dot notation.
- **Complex Boolean Logic**: Construct intricate queries with nested `AND` and `OR` conditions using a powerful `_logic` parameter.
- **Hybrid Database Support**: Write a single API endpoint that works transparently with both PostgreSQL and MongoDB for standard queries.
- **Standalone or Integrated**: Use it as a standalone utility with any Node.js framework or enjoy seamless integration with `@volcanicminds/backend`.

## Installation

```sh
npm install @volcanicminds/typeorm
```

## Core Concept

The library's main purpose is to bridge the gap between flat HTTP query strings and the structured query objects required by TypeORM. The flow is simple yet powerful:

`HTTP Query String` -> `applyQuery()` -> `TypeORM Query Object`

This allows you to build flexible and powerful data APIs with minimal boilerplate.

## Usage

### Use Case 1: Integrated with `@volcanicminds/backend`

This is the most straightforward way to use the library. The `executeFindQuery` function handles everything for you.

```typescript
// src/api/users/controller/user.ts
import { FastifyReply, FastifyRequest } from '@volcanicminds/backend'
import { executeFindQuery } from '@volcanicminds/typeorm'

export async function find(req: FastifyRequest, reply: FastifyReply) {
  // req.data() automatically extracts query parameters
  const { headers, records } = await executeFindQuery(
    repository.users, // Your TypeORM repository
    { company: true }, // Optional relations to include
    req.data()
  )

  return reply.type('application/json').headers(headers).send(records)
}
```

### Use Case 2: Standalone with Fastify/Express

You can use `applyQuery` directly in any project that uses TypeORM.

```typescript
// my-controller.ts
import { applyQuery } from '@volcanicminds/typeorm'
import { myUserRepository } from './repositories' // Your TypeORM repository instance

app.get('/users', async (req, reply) => {
  // applyQuery translates the request query into a TypeORM query object
  const typeOrmQuery = applyQuery(req.query, {}, myUserRepository)

  const [records, total] = await myUserRepository.findAndCount(typeOrmQuery)

  // You would then typically set pagination headers and return the records
  reply.send({ data: records, total })
})
```

## Query String Guide

### Pagination

Use `page` and `pageSize` to control pagination.

- `page`: The page number to retrieve. Defaults to `1`.
- `pageSize`: The number of records per page. Defaults to `25`.

**Example**: `GET /users?page=2&pageSize=50`

### Sorting

Use the `sort` parameter to define the order of the results. You can specify multiple `sort` parameters for multi-field sorting.

- `sort=fieldName`: Sorts by `fieldName` in ascending order.
- `sort=fieldName:desc`: Sorts by `fieldName` in descending order.

**Example**: `GET /users?sort=lastName:asc&sort=createdAt:desc`

### Filtering

Filters are applied by using `fieldName:operator=value`. If no operator is specified, it defaults to a simple equality check.

#### Operators Table

| Operator     | Description                          | Example URL                                   | PostgreSQL | MongoDB |
| :----------- | :----------------------------------- | :-------------------------------------------- | :--------: | :-----: |
| `:eq`        | Equals                               | `...&status:eq=active`                        |     ✅     |   ✅    |
| `:neq`       | Not equals                           | `...&status:neq=archived`                     |     ✅     |   ✅    |
| `:gt`, `:ge` | Greater than / Greater than or equal | `...&visits:gt=100`                           |     ✅     |   ✅    |
| `:lt`, `:le` | Less than / Less than or equal       | `...&price:lt=99.99`                          |     ✅     |   ✅    |
| `:in`        | Included in an array (comma-sep.)    | `...&status:in=active,pending`                |     ✅     |   ✅    |
| `:nin`       | Not included in an array             | `...&category:nin=old,obsolete`               |     ✅     |   ✅    |
| `:between`   | Is between two values (colon-sep.)   | `...&createdAt:between=2024-01-01:2024-12-31` |     ✅     |   ✅    |
| `:null`      | Is null                              | `...&deletedAt:null=true`                     |     ✅     |   ✅    |
| `:notNull`   | Is not null                          | `...&updatedAt:notNull=true`                  |     ✅     |   ✅    |
| `:contains`  | Contains (case-sensitive)            | `...&name:contains=Corp`                      |     ✅     |   ❌    |
| `:containsi` | Contains (case-insensitive)          | `...&name:containsi=corp`                     |     ✅     |   ✅    |
| `:starts`    | Starts with (case-sensitive)         | `...&code:starts=INV-`                        |     ✅     |   ❌    |
| `:startsi`   | Starts with (case-insensitive)       | `...&code:startsi=inv-`                       |     ✅     |   ✅    |
| `:ends`      | Ends with (case-sensitive)           | `...&file:ends=.pdf`                          |     ✅     |   ❌    |
| `:endsi`     | Ends with (case-insensitive)         | `...&file:endsi=.pdf`                         |     ✅     |   ✅    |
| `:eqi`       | Equals (case-insensitive)            | `...&country:eqi=it`                          |     ✅     |   ✅    |

#### Nested Relation Filters

Use dot notation to filter on fields of related entities.

**Example**: Find all users belonging to the company named "Volcanic Minds".
`GET /users?company.name:eq=Volcanic Minds`

### Complex Boolean Logic with `_logic`

For complex queries involving `AND` and `OR` groups, use the `_logic` parameter. Conditions in the URL can be given short aliases to keep the `_logic` string concise.

**Syntax**: `fieldName:operator[alias]=value`

- The `[alias]` is optional. If omitted, the alias defaults to the full parameter key (e.g., `fieldName:operator`).

**Example 1: Simple OR**

- **Goal**: Find users whose first name is 'Mario' OR last name is 'Rossi'.
- **URL**: `?firstName:eq[fn]=Mario&lastName:eq[ln]=Rossi&_logic=(fn OR ln)`

**Example 2: Complex Nested Logic**

- **Goal**: Find active users from Italy OR pending users from Germany.
  `(status:eq=active AND country:eq=IT) OR (status:eq=pending AND country:eq=DE)`
- **URL**:
  `?status:eq[s1]=active&country:eq[c1]=IT&status:eq[s2]=pending&country:eq[c2]=DE&_logic=((s1 AND c1) OR (s2 AND c2))`

This powerful syntax allows for the construction of virtually any query structure directly from the URL.

## API Reference

- **`executeFindQuery(repo, relations, data, extraWhere, extraOptions)`**: The main high-level function. Handles a full find-and-count query, processes all parameters, and returns records and pagination headers.
- **`executeCountQuery(repo, data, extraWhere)`**: A utility to only count records based on filters.
- **`applyQuery(data, extraWhere, repo)`**: The core translation function. Takes the raw query parameters and returns a TypeORM-compatible query object.
- **`useWhere(where, repo)`**: Translates only the filter part of the query.
- **`useOrder(order)`**: Translates only the sorting part of the query.

## Useful scripts

- 'node generate-hash.js <my-string>' : generate a new hash for a given string (used for password/testing purposes)

## License

This project is licensed under the MIT License.
