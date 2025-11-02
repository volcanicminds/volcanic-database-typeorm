import {
  Not,
  Like,
  ILike,
  Raw,
  Equal,
  IsNull,
  In,
  Between,
  MoreThan,
  MoreThanOrEqual,
  LessThan,
  LessThanOrEqual
} from 'typeorm'
import { parseLogicExpression } from './query/parser'
import { buildWhereFromAst } from './query/builder'

const evalOrder = (val: string = '') => (['desc', 'd', 'false', '1'].includes(val.toLowerCase()) ? 'desc' : 'asc')

export const useOrder = (order: string[] = []) => {
  const result = {}
  order
    .filter((o) => !!o)
    .forEach((o: string) => {
      const parts = o.split(':')
      const fieldFullPath = parts[0].split('.')
      const sortType = evalOrder(parts[1])

      let target = result
      while (fieldFullPath.length > 1) {
        const fieldPath: string = fieldFullPath.shift() || ''
        target = target[fieldPath] = target[fieldPath] || {}
      }

      const fieldName = fieldFullPath[0]

      target[fieldName] = sortType
    })

  return result
}

const typecastValue = (value: any) => {
  if (typeof value !== 'string') return value
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true') return true
  if (lowerValue === 'false') return false
  if (lowerValue === 'null') return null
  return value
}

export const useWhere = (where: any, repo?: any) => {
  const aliasMap = new Map<string, any>()
  const isTargetMongo = isMongo(repo)
  const val = (v) => v || 'notFound'

  const reservedOperators = {
    ':null': (v) => (typecastValue(v) === false ? Not(IsNull()) : IsNull()),
    ':notNull': (v) => (typecastValue(v) === true ? Not(IsNull()) : IsNull()),
    ':raw': (v) => Raw((alias) => `${alias} ${v}`),
    ':in': (v) => In(val(v).split(',').map(typecastValue)),
    ':nin': (v) => Not(In(val(v).split(',').map(typecastValue))),
    ':likei': (v) => (isTargetMongo ? new RegExp(val(v), 'i') : ILike(`%${val(v)}%`)),
    ':containsi': (v) => (isTargetMongo ? new RegExp(val(v), 'i') : ILike(`%${val(v)}%`)),
    ':ncontainsi': (v) => (isTargetMongo ? Not(new RegExp(val(v), 'i')) : Not(ILike(`%${val(v)}%`))),
    ':startsi': (v) => (isTargetMongo ? new RegExp(`^${val(v)}`, 'i') : ILike(`${val(v)}%`)),
    ':endsi': (v) => (isTargetMongo ? new RegExp(`${val(v)}$`, 'i') : ILike(`%${val(v)}`)),
    ':eqi': (v) => (isTargetMongo ? new RegExp(`^${val(v)}$`, 'i') : ILike(v)),
    ':neqi': (v) => (isTargetMongo ? Not(new RegExp(`^${val(v)}$`, 'i')) : Not(ILike(v))),
    ':like': (v) => Like(`${val(v)}`),
    ':contains': (v) => Like(`%${val(v)}%`),
    ':ncontains': (v) => Not(Like(`%${val(v)}%`)),
    ':starts': (v) => Like(`${val(v)}%`),
    ':ends': (v) => Like(`%${val(v)}`),
    ':eq': (v) => {
      const typedValue = typecastValue(v)
      if (typedValue === null) return IsNull()
      return isTargetMongo ? typedValue : Equal(typedValue)
    },
    ':neq': (v) => Not(Equal(typecastValue(v))),
    ':gt': (v) => MoreThan(v),
    ':ge': (v) => MoreThanOrEqual(v),
    ':lt': (v) => LessThan(v),
    ':le': (v) => LessThanOrEqual(v),
    ':between': (v) => {
      const s = v?.split(':')
      return s?.length == 2 ? Between(s[0], s[1]) : v
    }
  }

  const reservedWords = Object.keys(reservedOperators).join('|')
  const aliasRegex = /\[([^\]]+)\]$/

  const allConditions = {}

  for (const rawKey in where) {
    let alias = ''
    let key = rawKey

    const aliasMatch = rawKey.match(aliasRegex)
    if (aliasMatch) {
      alias = aliasMatch[1]
      key = rawKey.replace(aliasRegex, '')
    } else {
      alias = key
    }

    const m = key.match(new RegExp(`(${reservedWords})\\b`, 'ig'))
    const operator = m?.length ? m[0] : ':eq'
    const fullPath = key.replace(operator, '')
    const parts = fullPath.split('.')
    let value = where[rawKey]

    if (operator && reservedOperators[operator]) {
      value = reservedOperators[operator](value)
    }

    let condition = {}
    let target = condition
    while (parts.length > 1) {
      const part: string = parts.shift() || ''
      target = target[part] = target[part] || {}
    }
    target[parts[0]] = value

    aliasMap.set(alias, condition)
    Object.assign(allConditions, condition)
  }

  return { allConditions, aliasMap }
}

export function applyQuery(data, extraWhere, repo) {
  const { page: p = 1, pageSize = 25, skip: sk = 0, take: tk = 0, sort: s, _logic, ...where } = data
  const page: number = (p < 1 ? 1 : p) - 1
  const take: number = tk || pageSize
  const skip: number = sk || page * pageSize
  const order: string[] = !Array.isArray(s) ? [s] : s

  const query = {} as {
    skip?: number
    take?: number
    order?: object
    where?: object | object[]
  }

  if (skip) query.skip = skip
  if (take) query.take = take
  if (order) query.order = useOrder(order)

  const { allConditions, aliasMap } = useWhere(where, repo)

  if (_logic) {
    try {
      const ast = parseLogicExpression(_logic)
      query.where = buildWhereFromAst(ast, aliasMap, isMongo(repo))
    } catch (e) {
      console.error('Volcanic-TypeORM: Error parsing _logic parameter.', e)
      query.where = allConditions
    }
  } else {
    query.where = allConditions
  }

  if (extraWhere) {
    const { allConditions: extraConditions } = useWhere(extraWhere, repo)
    if (query.where && Object.keys(query.where).length > 0) {
      if (isMongo(repo)) {
        query.where = { $and: [query.where, extraConditions] }
      } else {
        query.where = { ...query.where, ...extraConditions }
      }
    } else {
      query.where = extraConditions
    }
  }

  return query
}

export async function executeFindQuery(
  repo: any,
  relations: any = {},
  data: any = {},
  extraWhere: any = {},
  extraOptions: any = {}
) {
  const extra = applyQuery(data, extraWhere, repo)

  const [records = [], totalCount] = await repo.findAndCount({
    relations: relations,
    ...extra,
    ...extraOptions
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
  const { where = {} } = applyQuery(data, extraWhere, repo)
  return await repo.count(isMongo(repo) ? where : { where: where })
}

function getType(repo) {
  return repo?.manager?.connection?.options?.type || 'pg'
}

function isMongo(repo) {
  return getType(repo) === 'mongodb'
}
