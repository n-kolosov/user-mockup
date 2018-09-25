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

router.get('/users/:id', async (ctx) => {
  const user = await queries.getUserById(ctx.params.id)
  ctx.render('user', {
    user: user,
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.post('/users/update', async (ctx) => {
  const update = await queries.updateUser(ctx.request.body)
  if (update === false) {
    ctx.redirect('/users/')
  } else {
    ctx.redirect('/')
  }
})

router.get('/auth/register', (ctx) => {
  ctx.render('register', {
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.post('/auth/register', async (ctx) => {
  const register = await queries.addUser(ctx.request.body)
  if (register === false) {
    ctx.redirect('/auth/register')
  } else {
    ctx.redirect('/users/')
  }
})

router.get('/users/:id/password', (ctx) => {
  ctx.render('password', {
    id: ctx.params.id,
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.post('/password/change', async (ctx) => {
  const update = await queries.updateUserPassword(ctx.request.body)
  if (update === false) {
    ctx.redirect('/users/')
  } else {
    ctx.redirect('/')
  }
})

router.get('/auth/login', (ctx) => {
  if (!ctx.isAuthenticated()) {
    ctx.render('login')
  } else {
    ctx.redirect('/')
  }
})

router.post('/auth/login', async (ctx) => {
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      if (user.status === 'Blocked') {
        ctx.redirect('/')
      } else if (user.status === 'Active') {
        ctx.login(user)
        ctx.redirect('/')
      }
    } else {
      err = 'User does not exist'
      console.log(err)
      ctx.redirect('/')
    }
  })(ctx)
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
