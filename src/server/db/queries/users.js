'use strict'
const bcrypt = require('bcryptjs')
const knex = require('../connection')
const userValidation = require('../validations/userValidations')

async function getHashFromPassword (password) {
  const salt = await bcrypt.genSalt()
  return bcrypt.hash(password, salt)
}

function getUserByUsername (username) {
  return knex.select().table('users').where('username', username)
}

async function usernameUniqueCheck (username) {
  const result = await getUserByUsername(username)
  return !!(result.length === 0)
}

// Валидаця не работает
async function addUser (user) {
  const usernameUnique = await usernameUniqueCheck(user.username)
  const usernamePattern = userValidation.usernamePatternCheck(user.username)
  const passwordLength = userValidation.passwordLengthCheck(user.password)

  const hash = await getHashFromPassword(user.password)
  if (usernameUnique && usernamePattern && passwordLength) {
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
    console.log('Username is incorrect')
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
