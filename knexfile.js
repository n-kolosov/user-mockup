'use strict'
const path = require('path')
const config = require('./config')
const BASE_PATH = path.join(__dirname, 'src', 'server', 'db')

module.exports = {
  test: {
    client: 'pg',
    connection: `postgres://${config.pgUser}:${config.pgPassword}@${config.pgHost}/users-mockup-test`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  },
  development: {
    client: 'pg',
    connection: `postgres://${config.pgUser}:${config.pgPassword}@${config.pgHost}/users-mockup`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  }
}
