const glob = require('glob')
const pluralize = require('pluralize')
// const path = require('path')

export function load() {
  const classes: any = {}
  const repositories: any = {}
  const entities: any[] = []

  const patterns = [`${__dirname}/../entities/*.e.{ts,js}`, `${process.cwd()}/src/entities/*.e.{ts,js}`]
  patterns.forEach((pattern) => {
    console.log('Looking for ' + pattern)
    glob.sync(pattern, { nodir: true, nosort: true, stat: false }).forEach((f: string) => {
      console.log(f)

      const entityClass = require(f)
      classes[entityClass.name] = entityClass
      repositories[pluralize(entityClass.name.toLowerCase())] = entityClass
      entities.push(entityClass)
    })
  })

  console.log('Entities loaded: ' + entities.length)
  return { classes, repositories, entities }
}
