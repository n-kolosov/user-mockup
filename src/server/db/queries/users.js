const bcrypt = require('bcryptjs')
const knex = require('../connection')
const userValidation = require('../validations/userValidations')

function addUser (user) {
  const salt = bcrypt.genSaltSync()
  const hash = bcrypt.hashSync(user.password, salt)
  if (userValidation.userValidation(user.username) === true){
    return knex('users')
        .insert({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role,
          password: hash,
          status: 'active'
        })
        .returning('*')
  } else {
    return false
  }
}
/* Данный метод обновляет запись в БД о юзере с определённым id
function updateUser (user) {
  return false
}
*/
function getAllUsers () {
  return knex.select().table('users')
}

function getUser (id) {
  return knex.select().table('users').where('id', id)
}

module.exports = {
  addUser, getAllUsers, getUser
}
