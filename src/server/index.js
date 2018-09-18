'use strict'
const Koa = require('koa')
const Router = require('koa-router')
const Pug = require('koa-pug')
const Serve = require('koa-static')
const bodyParser = require('koa-bodyparser')
const session = require('koa-session')
const passport = require('koa-passport')
const AccessControl = require('accesscontrol')
const config = require('../../config')
const queries = require('./db/queries/users')
const PORT = process.env.PORT || 3000
const app = new Koa()
const router = new Router()
const pug = new Pug({
  viewPath: 'src/server/views',
  basedir: 'src/server/views',
  app: app
})

app.keys = [config.secretKey]
app.use(session(app))

function handle404Errors (ctx) {
  if (ctx.status !== 404) return
  ctx.redirect('/not_found')
}

function notFound (ctx) {
  ctx.status = 404
  ctx.render('404', {
    userAuthenticated: ctx.isAuthenticated()
  })
}

function home (ctx) {
  ctx.render('home', {
    userAuthenticated: ctx.isAuthenticated()
  })
}

const getAllUsers = async (ctx) => {
  const users = await queries.getAllUsers()
  ctx.render('users', {
    users: users
  })
}

function registerForm (ctx) {
  if (!ctx.isAuthenticated()) {
    ctx.render('register')
  } else {
    ctx.redirect('/')
  }
}

const register = async (ctx) => {
  const user = await queries.addUser(ctx.request.body)
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      ctx.login(user)
      ctx.redirect('/')
    } else {
      ctx.status = 400
      ctx.body = { status: 'error' }
    }
  })(ctx)
}

function loginForm (ctx) {
  if (!ctx.isAuthenticated()) {
    ctx.render('login')
  } else {
    ctx.redirect('/')
  }
}

const login = async (ctx) => {
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      ctx.login(user)
      ctx.redirect('/')
    } else {
      ctx.status = 400
      ctx.body = { status: 'error' }
    }
  })(ctx)
}

const logout = async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout()
    ctx.redirect('/')
  } else {
    ctx.body = { success: false }
    ctx.throw(401)
  }
}

router.get('/', home)
router.get('/not_found', notFound)
router.get('/users', getAllUsers)

router.get('/auth/register', registerForm)
router.post('/auth/register', register)
router.get('/auth/login', loginForm)
router.post('/auth/login', login)
router.get('/auth/logout', logout)

app.use(bodyParser())

require('./auth')
app.use(passport.initialize())
app.use(passport.session())

app.use(Serve('./public'))
app.use(router.routes())
app.use(handle404Errors)

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})

module.exports = server
