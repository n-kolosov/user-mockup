'use strict'
exports.up = (knex, Promise) => {
  return knex.schema.createTable('users', (table) => {
    table.increments()
    table.string('username').unique().notNullable()
    table.string('password').notNullable()
    table.string('role').notNullable().defaultTo('User')
  })
}

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('users')
}
