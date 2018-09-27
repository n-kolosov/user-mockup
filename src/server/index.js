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
const PORT = process.env.PORT || 3000

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

async function checkRole (ctx, role) {
  const id = ctx.cookies.get('id')
  if (id === undefined) {
    return false
  } else {
    const userRole = await queries.getUserById(id)
    return userRole['role'] === role
  }
}

router.get('/users', async (ctx) => {
  const role1 = await checkRole(ctx, 'admin')
  const role2 = await checkRole(ctx, 'Merchant Manager')
  if (role1 || role2) {
    const users = await queries.getAllUsers()
    ctx.render('users', {
      flash: ctx.flash('message'),
      users: users,
      userAuthenticated: ctx.isAuthenticated()
    })
  } else {
    ctx.status = 403
    ctx.render('403', {
      userAuthenticated: ctx.isAuthenticated()
    })
  }
})

router.get('/users/:id', async (ctx) => {
  const role1 = await checkRole(ctx, 'admin')
  if (role1 === true) {
    const user = await queries.getUserById(ctx.params.id)
    ctx.render('user', {
      user: user,
      userAuthenticated: ctx.isAuthenticated()
    })
  } else {
    ctx.status = 403
    ctx.render('403', {
      userAuthenticated: ctx.isAuthenticated()
    })
  }
})

router.get('/auth/register', async (ctx) => {
  const role1 = await checkRole(ctx, 'admin')
  if (role1 === true) {
    ctx.render('register', {
      flash: ctx.flash('message'),
      userAuthenticated: ctx.isAuthenticated()
    })
  } else {
    ctx.status = 403
    ctx.render('403', {
      userAuthenticated: ctx.isAuthenticated()
    })
  }
})

router.get('/users/:id/username', async (ctx) => {
  const role1 = await checkRole(ctx, 'admin')
  if (role1 === true) {
    ctx.render('username', {
      id: ctx.params.id,
      userAuthenticated: ctx.isAuthenticated()
    })
  } else {
    ctx.status = 403
    ctx.render('403', {
      userAuthenticated: ctx.isAuthenticated()
    })
  }
})

router.get('/users/:id/password', async (ctx) => {
  const role1 = await checkRole(ctx, 'admin')
  if (role1 === true) {
    ctx.render('password', {
      id: ctx.params.id,
      userAuthenticated: ctx.isAuthenticated()
    })
  } else {
    ctx.status = 403
    ctx.render('403', {
      userAuthenticated: ctx.isAuthenticated()
    })
  }
})

router.get('/not_found', (ctx) => {
  ctx.status = 404
  ctx.render('404', {
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.get('/', (ctx) => {
  ctx.render('home', {
    flash: ctx.flash('message'),
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.post('/users/update', async (ctx) => {
  const update = await queries.updateUser(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'User update failed')
    ctx.redirect('/users/')
  } else {
    ctx.flash('message', 'User update successful')
    ctx.redirect('/users/')
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

router.post('/password/change', async (ctx) => {
  const update = await queries.updateUserPassword(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'Password update error')
    ctx.redirect('/users/')
  } else {
    ctx.flash('message', 'Password updated successfully')
    ctx.redirect('/users/')
  }
})

router.post('/username/change', async (ctx) => {
  const update = await queries.updateUserUsername(ctx.request.body)
  if (update === false) {
    ctx.flash('message', 'Username update error')
    ctx.redirect('/users/')
  } else {
    ctx.flash('message', 'Username updated successfully')
    ctx.redirect('/users/')
  }
})

router.get('/auth/login', (ctx) => {
  if (!ctx.isAuthenticated()) {
    ctx.render('login', {
      flash: ctx.flash('message')
    })
  } else {
    ctx.redirect('/')
  }
})

router.get('/query/:id', async (ctx) => {
  ctx.body = await queries.getUserById(ctx.params.id)
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
