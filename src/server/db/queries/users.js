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
  return !Array.isArray(result) || result.length === 0
}

async function addUser (user) {
  const usernameUnique = await usernameUniqueCheck(user.username)
  const usernamePattern = userValidation.usernamePatternCheck(user.username)
  const passwordLength = userValidation.passwordLengthCheck(user.password)
  const hash = await getHashFromPassword(user.password)
  if (usernameUnique && usernamePattern && passwordLength) {
    try {
      return knex('users')
        .insert({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role,
          password: hash,
          status: 'Active'
        })
    } catch (err) {
      console.log(err.stack)
      return false
    }
  } else {
    console.log('Username is incorrect')
    return false
  }
}

function getAllUsers () {
  return knex.select().table('users').orderBy('username', 'asc')
}

async function updateUser (user) {
  try {
    return knex('users')
      .update({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      })
      .where('id', user.id)
  } catch (err) {
    console.log(err.stack)
    return false
  }
}

async function updateUserPassword (user) {
  const hash = await getHashFromPassword(user.password)
  if (userValidation.passwordLengthCheck(user.password)) {
    try {
      return knex('users')
        .update({
          password: hash
        })
        .where('id', user.id)
    } catch (err) {
      console.log(err.stack)
      return false
    }
  } else {
    return false
  }
}

async function updateUserUsername (user) {
  const usernameUnique = await usernameUniqueCheck(user.username)
  const usernamePattern = userValidation.usernamePatternCheck(user.username)
  if (usernameUnique && usernamePattern) {
    try {
      return knex('users')
          .update({
            username: user.username
          })
          .where('id', user.id)
    } catch (err) {
      console.log(err.stack)
      return false
    }
  } else {
    return false
  }
}

async function getUserById (id) {
  const user = await knex.select().table('users').where('id', id)
  return user[0]
}

module.exports = {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  getUserByUsername,
  updateUserUsername
}
