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

export function applyQuery(data) {
  const { page = 0, pageSize = 0, skip: sk = 0, take: tk = 0, sort: s, ...where } = data
  const take: number = tk || pageSize || 50
  const skip: number = sk || page * pageSize || 0
  const order: string[] = !Array.isArray(s) ? [s] : s

  const evalOrder = (val: string = '') => (['desc', 'd', 'false', '1'].includes(val.toLowerCase()) ? 'desc' : 'asc')
  const useOrder = (order: string[] = []) => {
    const orderBy = {}
    order
      .filter((o) => !!o)
      .forEach((o: string) => {
        const p = o.split(':')
        orderBy[p[0]] = evalOrder(p[1])
      })

    return orderBy
  }

  const useWhere = (where: any) => {
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
      console.log('EVALUATE FIELD')
      console.log('regexp: ' + JSON.stringify(m))
      console.log('target: ' + JSON.stringify(target))
      console.log('fieldName: ' + fieldName)
      console.log('operator: ' + operator)
      console.log('value: ' + value)
      console.log('parts[0]: ' + JSON.stringify(parts[0]))
      console.log('where[' + objectPath + ']: ' + JSON.stringify(where[objectPath]))

      if (operator) {
        value = reservedOperators[operator](value)
      }

      target[fieldName] = value
      // target[parts[0]] = where[objectPath]
    }

    return result
  }

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

  console.log('FINAL WHERE: ' + JSON.stringify(query.where))

  return query
}

export async function executeFindQuery(repo: any, relations = {}, data = {}) {
  const extra = applyQuery(data)

  const [records = [], totalCount] = await repo.findAndCount({
    relations: relations,
    ...extra
  })

  return {
    records,
    headers: {
      'v-total': totalCount,
      'v-count': records.length,
      'v-pagesize': extra.take,
      'v-page': 1
    }
  }
}

export async function executeCountQuery(repo: any, data = {}) {
  const { where = {} } = applyQuery(data)
  return await repo.count({ where: where })
}
