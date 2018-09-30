'use strict'
const Koa = require('koa')
const Router = require('koa-router')
const Pug = require('koa-pug')
const Serve = require('koa-static')
const bodyParser = require('koa-bodyparser')
const session = require('koa-session')
const passport = require('koa-passport')
const flash = require('koa-better-flash')

const config = require('../../config')
const queries = require('./db/queries/users')
const PORT = 3000

const app = new Koa()
const router = new Router()
const pug = new Pug({
  viewPath: 'src/server/views',
  basedir: 'src/server/views',
  app: app
})

function handle404Errors (ctx) {
  if (ctx.status !== 404) return
  ctx.redirect('/not_found')
}

async function checkRole (ctx, roles) {
  const id = ctx.cookies.get('id')
  if ((id !== undefined) && (roles.length !== 0)) {
    const user = await queries.getUserById(id)
    let a = 0
    roles.forEach(function (role) {
      if (role === user['role']) {
        a = +1
      }
    })
    return a > 0
  }
}

function renderPage (ctx, status, page, params) {
  ctx.status = status
  ctx.render(page, {
    params: params,
    id: ctx.params.id,
    flash: ctx.flash('message'),
    userAuthenticated: ctx.isAuthenticated()
  })
}

router.get('/', (ctx) => {
  renderPage(ctx, 200, 'home')
})

router.get('/not_found', (ctx) => {
  renderPage(ctx, 404, '404')
})

router.get('/auth/register', async (ctx) => {
  const access = await checkRole(ctx, ['admin'])
  if (access) {
    renderPage(ctx, 200, 'register')
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.post('/auth/register', async (ctx) => {
  const register = await queries.addUser(ctx.request.body)
  if (register === false) {
    ctx.flash('message', 'Registration failed')
    ctx.redirect('/auth/register')
  } else {
    ctx.flash('message', 'Registration successful')
    ctx.redirect('/users/')
  }
})

router.get('/users/:id/username', async (ctx) => {
  const access = await checkRole(ctx, ['admin'])
  if (access) {
    renderPage(ctx, 200, 'username')
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.post('/username/change', async (ctx) => {
  const update = await queries.updateUserUsername(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'Username update error')
  } else {
    ctx.flash('message', 'Username updated successfully')
  }
  ctx.redirect('/users/')
})

router.get('/users/:id/password', async (ctx) => {
  const access = await checkRole(ctx, ['admin'])
  if (access) {
    renderPage(ctx, 200, 'password')
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.post('/password/change', async (ctx) => {
  const update = await queries.updateUserPassword(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'Password update error')
  } else {
    ctx.flash('message', 'Password updated successfully')
  }
  ctx.redirect('/users/')
})

router.get('/users', async (ctx) => {
  const access = await checkRole(ctx, ['admin'])
  if (access) {
    const users = await queries.getAllUsers()
    renderPage(ctx, 200, 'users', users)
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.get('/users/:id', async (ctx) => {
  const access = await checkRole(ctx, ['admin'])
  if (access) {
    const user = await queries.getUserById(ctx.params.id)
    renderPage(ctx, 200, 'user', user)
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.post('/users/update', async (ctx) => {
  const update = await queries.updateUser(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'User update failed')
  } else {
    ctx.flash('message', 'User update successful')
  }
  ctx.redirect('/users/')
})

router.post('/auth/login', async (ctx) => {
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      if (user.status === 'Blocked') {
        ctx.flash('message', 'You\'re blocked, ha-ha-ha!')
        ctx.redirect('/')
      } else if (user.status === 'Active') {
        ctx.cookies.set('id', user['id'])
        ctx.login(user)
        ctx.flash('message', 'Welcome')
        ctx.redirect('/')
      }
    } else {
      console.log(err)
      ctx.flash('message', 'Login failed. Try again with another e-mail or password')
      ctx.redirect('/auth/login')
    }
  })(ctx)
})

router.get('/merchant_manager', async (ctx) => {
  const access = await checkRole(ctx, ['admin', 'Merchant Manager'])
  if (access) {
    renderPage(ctx, 200, 'merchantManager')
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.get('/category_manager', async (ctx) => {
  const access = await checkRole(ctx, ['admin', 'Category Manager'])
  if (access) {
    renderPage(ctx, 200, 'categoryManager')
  } else {
    renderPage(ctx, 403, '403')
  }
})

router.get('/auth/login', (ctx) => {
  if (!ctx.isAuthenticated()) {
    renderPage(ctx, 200, 'login')
  } else {
    ctx.redirect('/')
  }
})

router.get('/auth/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.cookies.set('id', undefined)
    ctx.logout()
    ctx.redirect('/')
  } else {
    ctx.body = { success: false }
    ctx.throw(401)
  }
})

app.keys = [config.secretKey]
app.use(session(app))
app.use(flash(app))
app.use(bodyParser())

require('./auth')
app.use(passport.initialize())
app.use(passport.session())

app.use(Serve('./public'))
app.use(router.routes())
app.use(handle404Errors)

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})
