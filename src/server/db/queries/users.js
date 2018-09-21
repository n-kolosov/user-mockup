const bcrypt = require('bcryptjs')
const knex = require('../connection')

function addUser (user) {
  const salt = bcrypt.genSaltSync()
  const hash = bcrypt.hashSync(user.password, salt)
  return knex('users')
    .insert({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      password: hash
    })
    .returning('*')
}


function getAllUsers() {
  return knex.select().table('users')
}

module.exports = {
  addUser, getAllUsers
}
