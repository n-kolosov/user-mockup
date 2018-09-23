'use strict'

function userValidation (username) {
  if (username.match(/^.*@goods\.ru$/)) {
    return true
  } else {
    return false
  }
}

module.exports = {
  userValidation
}
