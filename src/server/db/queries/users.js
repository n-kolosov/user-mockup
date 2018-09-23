const bcrypt = require('bcryptjs')
const knex = require('../connection')
const userValidation = require('../validations/userValidations')

async function addUser (user) {
  const salt = await bcrypt.genSalt()
  const hash = await bcrypt.hash(user.password, salt)
  if (userValidation.usernamePatternCheck(user.username) && userValidation.passwordLengthCheck(user.password)) {
    return knex('users')
      .insert({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        password: hash,
        status: user.status
      })
      .returning('*')
  } else {
    return false
  }
}

function getAllUsers () {
  return knex.select().table('users').orderBy('username', 'asc')
}

function updateUser (user) {
  if (userValidation.usernamePatternCheck(user.username)) {
    return knex('users')
      .update({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        status: user.status
      })
      .where('id', user.id)
      .catch(function (err) {
        console.log(err.stack)
        return false
      })
  } else {
    return false
  }
}

function getUserById (id) {
  return knex.select().table('users').where('id', id)
}

function getUserByUsername (username) {
  return knex.select().table('users').where('username', username)
}

module.exports = {
  addUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser
}
