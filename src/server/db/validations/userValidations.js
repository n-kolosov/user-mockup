'use strict'

function usernamePatternCheck (username) {
  return !!username.match(/^.*@goods\.ru$/)
}

function passwordLengthCheck (password) {
  return password.length !== 0
}

module.exports = {
  usernamePatternCheck,
  passwordLengthCheck
}
