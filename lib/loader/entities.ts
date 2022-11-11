const glob = require('glob')
const pluralize = require('pluralize')

export function load() {
  const classes: any = {}
  const repositories: any = {}
  const entities: any[] = []

  const patterns = [`${__dirname}/../entities/*.e.{ts,js}`, `${process.cwd()}/src/entities/*.e.{ts,js}`]
  patterns.forEach((pattern) => {
    glob.sync(pattern, { nodir: true, nosort: true, stat: false }).forEach((f: string) => {
      const entityClass = require(f)
      classes[entityClass.name] = entityClass
      repositories[pluralize(entityClass.name.toLowerCase())] = entityClass
      entities.push(entityClass)
    })
  })

  return { classes, repositories, entities }
}
