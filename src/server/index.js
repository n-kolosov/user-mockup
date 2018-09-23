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
const ac = new AccessControl()
const pug = new Pug({
  viewPath: 'src/server/views',
  basedir: 'src/server/views',
  app: app
})

function handle404Errors (ctx) {
  if (ctx.status !== 404) return
  ctx.redirect('/not_found')
}

function authenticate (ctx) {
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      ctx.login(user)
      ctx.redirect('/')
    } else {
      err = 'User does not exists'
      console.log(err)
      ctx.status = 400
      ctx.body = { status: 'error' }
    }
  })(ctx)
}

router.get('/not_found', (ctx) => {
  ctx.status = 404
  ctx.render('404', {
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.get('/', (ctx) => {
  ctx.render('home', {
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.get('/users', async (ctx) => {
  const users = await queries.getAllUsers()
  ctx.render('users', {
    users: users,
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.get('/auth/register', (ctx) => {
  if (!ctx.isAuthenticated()) {
    ctx.render('register')
  } else {
    ctx.redirect('/')
  }
})

router.post('/auth/register', async (ctx) => {
  await queries.addUser(ctx.request.body)
  return authenticate(ctx)
})

router.get('/auth/login', (ctx) => {
  if (!ctx.isAuthenticated()) {
    ctx.render('login')
  } else {
    ctx.redirect('/')
  }
})

router.post('/auth/login', async (ctx) => {
  return authenticate(ctx)
})

router.get('/auth/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout()
    ctx.redirect('/')
  } else {
    ctx.body = { success: false }
    ctx.throw(401)
  }
})

app.keys = [config.secretKey]
app.use(session(app))
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
