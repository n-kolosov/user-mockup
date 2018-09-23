'use strict'
exports.up = (knex, Promise) => {
  return knex.schema.createTable('users', (table) => {
    table.increments()
    table.string('firstName').notNullable()
    table.string('lastName').notNullable()
    table.string('username').unique().notNullable()
    table.string('password').notNullable()
    table.string('role').notNullable().defaultTo('merchantManager')
  })
}

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('users')
}
