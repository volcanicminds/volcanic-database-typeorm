const path = require('path')
const glob = require('glob')
const pluralize = require('pluralize')

export function load() {
  const classes: any = {}
  const repositories: any = {}
  const entities: any[] = []

  const patterns = [
    path.join(__dirname, '..', 'entities', '*.e.{ts,js}'),
    path.join(process.cwd(), 'src', 'entities', '*.e.{ts,js}')
  ]

  patterns.forEach((pattern) => {
    glob.sync(pattern, { nodir: true, nosort: true, stat: false }).forEach((f: string) => {
      const entityClass = require(f)
      const entityNames = Object.keys(entityClass)

      entityNames.map((name) => {
        classes[name] = entityClass[name]
        repositories[pluralize(name.toLowerCase())] = entityClass[name]
        entities.push(entityClass[name])
      })
    })
  })

  return { classes, repositories, entities }
}
