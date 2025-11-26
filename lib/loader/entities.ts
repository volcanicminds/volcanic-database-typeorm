import * as path from 'path'
import { globSync } from 'glob'
import pluralize from 'pluralize'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function load() {
  const classes: any = {}
  const repositories: any = {}
  const entities: any[] = []

  const patterns = [
    path.join(__dirname, '..', 'entities', '*.e.{ts,js}'),
    path.join(process.cwd(), 'src', 'entities', '*.e.{ts,js}')
  ]

  patterns.forEach((pattern) => {
    globSync(pattern, { nodir: true, windowsPathsNoEscape: true }).forEach((f: string) => {
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
