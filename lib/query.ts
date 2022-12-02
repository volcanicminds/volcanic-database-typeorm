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

      // Set value at end of path
      target[parts[0]] = where[objectPath]
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
