import {
  Not,
  Like,
  ILike,
  Equal,
  IsNull,
  In,
  Between,
  MoreThan,
  MoreThanOrEqual,
  LessThan,
  LessThanOrEqual
} from 'typeorm'

import * as log from './util/logger'

const evalOrder = (val: string = '') => (['desc', 'd', 'false', '1'].includes(val.toLowerCase()) ? 'desc' : 'asc')

export const useOrder = (order: string[] = []) => {
  const result = {}
  order
    .filter((o) => !!o)
    .forEach((o: string) => {
      // Split path into component parts
      const parts = o.split(':')
      const fieldFullPath = parts[0].split('.')
      const sortType = evalOrder(parts[1])

      // Create sub-objects along path as needed
      let target = result
      while (fieldFullPath.length > 1) {
        const fieldPath: string = fieldFullPath.shift() || ''
        target = target[fieldPath] = target[fieldPath] || {}
      }

      const fieldName = fieldFullPath[0]

      // Set value at end of path
      target[fieldName] = sortType
    })

  return result
}

export const useWhere = (where: any) => {
  const result = {}

  const val = (v) => v || 'notFound'
  const reservedOperators = {
    ':null': (v) => (v == 'false' ? Not(IsNull()) : IsNull()), // generic: is null
    ':notNull': (v) => (v == 'true' ? Not(IsNull()) : IsNull()), // generic: is not null

    ':in': (v) => In(val(v).split(',')), // array: includes
    ':nin': (v) => Not(In(val(v).split(','))), // array: not includes

    ':likei': (v) => ILike(`${val(v)}`), // string: contains
    ':containsi': (v) => ILike(`%${val(v)}%`), // string: contains (ignore-case)
    ':ncontainsi': (v) => Not(ILike(`%${val(v)}%`)), // string: not contains (ignore-case)
    ':startsi': (v) => ILike(`${val(v)}%`), // string: starts (ignore-case)
    ':endsi': (v) => ILike(`%${val(v)}`), // string: ends (ignore-case)
    ':eqi': (v) => ILike(v), // generic: equals (ignore-case)
    ':neqi': (v) => Not(ILike(v)), // generic: not equals (ignore-case)

    ':like': (v) => Like(`${val(v)}`), // string: contains
    ':contains': (v) => Like(`%${val(v)}%`), // string: contains
    ':ncontains': (v) => Not(Like(`%${val(v)}%`)), // string: not contains
    ':starts': (v) => Like(`${val(v)}%`), // string: starts
    ':ends': (v) => Like(`%${val(v)}`), // string: ends
    ':eq': (v) => Equal(v), // generic: equals
    ':neq': (v) => Not(Equal(v)), // generic: not equals

    ':gt': (v) => MoreThan(v), // generic: greater than
    ':ge': (v) => MoreThanOrEqual(v), // generic: greater than or equals
    ':lt': (v) => LessThan(v), // generic: less than
    ':le': (v) => LessThanOrEqual(v), // generic: less than or equals
    ':between': (v) => {
      const s = v?.split(':')
      return s?.length == 2 ? Between(s[0], s[1]) : v
    } // generic: in the range, for example - myfield:between=10:15
  }

  const reservedWords = Object.keys(reservedOperators).join('|')

  // For each object path (property key) in the object
  for (const objectPath in where) {
    // Split path into component parts
    const parts = objectPath.split('.')

    // Create sub-objects along path as needed
    let target = result
    while (parts.length > 1) {
      const part: string = parts.shift() || ''
      target = target[part] = target[part] || {}
    }

    const m = parts[0].match(new RegExp(`(${reservedWords})\\b`, 'ig'))
    const operator = m?.length ? m[0] : null
    const fieldName = operator ? parts[0].replace(operator, '') : parts[0]
    let value = where[objectPath]

    // Set value at end of path
    if (operator) {
      value = reservedOperators[operator](value)
    }

    target[fieldName] = value
  }

  return result
}

export function applyQuery(data, extraWhere) {
  const { page: p = 1, pageSize = 25, skip: sk = 0, take: tk = 0, sort: s, ...where } = data
  const page: number = (p < 1 ? 1 : p) - 1
  const take: number = tk || pageSize
  const skip: number = sk || page * pageSize
  const order: string[] = !Array.isArray(s) ? [s] : s

  const query = {} as {
    skip?: number
    take?: number
    order?: object
    where?: object
  }

  if (skip) query.skip = skip
  if (take) query.take = take
  if (order) query.order = useOrder(order)
  if (where) query.where = useWhere(where)

  let extra: any
  if (extraWhere) {
    extra = Array.isArray(extraWhere) ? extraWhere.map((w) => useWhere(w)) : useWhere(extraWhere)
  }

  // merge extraWhere and where
  query.where = Array.isArray(extra) ? extra.map((w) => ({ ...w, ...query.where })) : { ...extra, ...query.where }

  // log.debug('FINAL WHERE: ' + JSON.stringify(query.where))
  return query
}

export async function executeFindQuery(repo: any, relations = {}, data: any = {}, extraWhere: any = {}) {
  const extra = applyQuery(data, extraWhere)

  const [records = [], totalCount] = await repo.findAndCount({
    relations: relations,
    ...extra
  })

  return {
    records,
    headers: {
      'v-count': records.length,
      'v-total': totalCount,
      'v-page': data.page || 1,
      'v-pageSize': extra.take,
      'v-pageCount': Math.ceil(extra.take ? totalCount / extra.take : 1)
    }
  }
}

export async function executeCountQuery(repo: any, data = {}, extraWhere: any = {}) {
  const { where = {} } = applyQuery(data, extraWhere)

  console.log(Object.keys(repo.target.dataSource.options))
  console.log(repo.target.dataSource.options)

  const res = await repo.count(isMongo(repo) ? where : { where: where })
  return res
}

function getType(repo) {
  return repo?.target?.dataSource?.options?.type || 'pg'
}

function isMongo(repo) {
  return getType(repo) === 'mongodb'
}
