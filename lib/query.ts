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

export const useWhere = (where: any, repo?: any) => {
  const result = {}
  const isTargetMongo = isMongo(repo)
  const val = (v) => v || 'notFound'

  const reservedOperators = {
    ':null': (v) => (v == 'false' ? Not(IsNull()) : IsNull()),
    ':notNull': (v) => (v == 'true' ? Not(IsNull()) : IsNull()),
    ':raw': (v) => Raw((alias) => `${alias} ${v}`),
    ':in': (v) => In(val(v).split(',')),
    ':nin': (v) => Not(In(val(v).split(','))),
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
    ':eq': (v) => (isTargetMongo ? v : Equal(v)),
    ':neq': (v) => Not(Equal(v)),
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

  for (const objectPath in where) {
    const parts = objectPath.split('.')

    let target = result
    while (parts.length > 1) {
      const part: string = parts.shift() || ''
      target = target[part] = target[part] || {}
    }

    const m = parts[0].match(new RegExp(`(${reservedWords})\\b`, 'ig'))
    const operator = m?.length ? m[0] : null
    const fieldName = operator ? parts[0].replace(operator, '') : parts[0]
    let value = where[objectPath]

    if (operator) {
      value = reservedOperators[operator](value)
    }

    target[fieldName] = value
  }

  return result
}

export function applyQuery(data, extraWhere, repo) {
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
  if (where) query.where = useWhere(where, repo)

  let extra: any
  if (extraWhere) {
    extra = Array.isArray(extraWhere) ? extraWhere.map((w) => useWhere(w, repo)) : useWhere(extraWhere, repo)
  }

  query.where = Array.isArray(extra) ? extra.map((w) => ({ ...w, ...query.where })) : { ...extra, ...query.where }
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
