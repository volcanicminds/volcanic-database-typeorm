'use strict'

global.npmDebugServerStarted = true // internal debug purpose
require('./index')().then(async (AppDataSource) => {
  console.log('bbb')
  const c1 = new global.database.model.User()
  c1.breed = 'nread2'
  c1.age = 'young'
  c1.name = 'fuffy'
  await global.database.repository.users.save(c1)
})
