'use strict'
const bcrypt = require('bcryptjs')
const knex = require('../connection')
const userValidation = require('../validations/userValidations')

async function getHashFromPassword (password) {
  const salt = await bcrypt.genSalt()
  return await bcrypt.hash(password, salt)
}

async function addUser (user) {
  const hash = await getHashFromPassword(user.password)
  if (userValidation.usernamePatternCheck(user.username) && userValidation.passwordLengthCheck(user.password)) {
    return knex('users')
      .insert({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        password: hash,
        status: 'Active'
      })
      .catch(function (err) {
        console.log(err.stack)
        return false
      })
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

async function updateUserPassword (user) {
  const hash = await getHashFromPassword(user.password)
  if (userValidation.passwordLengthCheck(user.password)) {
    return knex('users')
      .update({
        password: hash
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

module.exports = {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword
}
