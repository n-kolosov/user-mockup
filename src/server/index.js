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

  // метод checkAccess должен сравнивать роль из БД с ролью, которая передана в параметр
  /* Попробовать сначала затащить в метод все роуты, а валидацию добавить потом
  checkAccess  (role)  {
    const id = ctx.cookies.get('id')
    const user = queries.getUserById(id)
    return user[0]['role'] === role
  }
*/
function getRequest (path, page, status) {
  router.get(path, (ctx) => {
    ctx.status = status
    ctx.render(page, {
      id: ctx.params.id,
      flashUserBlocked: ctx.flash('userBlocked'),
      flashUserLoginSuccessful: ctx.flash('userLoginSuccessful'),
      flashUserLoginError: ctx.flash('userLoginError'),
      flashRegisterError: ctx.flash('registerError'),
      userAuthenticated: ctx.isAuthenticated()
    })
  })
}

async function getRequestWithQuery(path, page, status, query) {
  router.get(path, async (ctx) => {
    const result = await query
    ctx.render(page, {
      flashUpdateError: ctx.flash('updateError'),
      flashUpdateSuccess: ctx.flash('updateSuccess'),
      flashRegisterSuccess: ctx.flash('registerSuccess'),
      flashPasswordUpdateError: ctx.flash('passwordUpdateError'),
      flashPasswordUpdateSuccess: ctx.flash('passwordUpdateSuccess'),
      result: result,
      userAuthenticated: ctx.isAuthenticated()
    })
  })
}


getRequest('/not_found', '404', 404)
getRequest('/', 'home', 200)
getRequest('/auth/register', 'register', 200)
getRequest('/users/:id/password', 'password', 200)
getRequestWithQuery('/users', 'users', 200, queries.getAllUsers())

function handle404Errors (ctx) {
  if (ctx.status !== 404) return
  ctx.redirect('/not_found')
}

router.get('/users/:id', async (ctx) => {
  const user = await queries.getUserById(ctx.params.id)
  ctx.render('user', {
    user: user,
    userAuthenticated: ctx.isAuthenticated()
  })
})

router.get('/auth/login', (ctx) => {
  if (!ctx.isAuthenticated()) {
    ctx.render('login')
  } else {
    ctx.redirect('/')
  }
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

/*
router.get('/users', async (ctx) => {
  const id = ctx.cookies.get('id')
  const role = await queries.getUserById(id)
  if (role[0]['role'] === 'admin') {
    const users = await queries.getAllUsers()
    ctx.render('users', {
      flashUpdateError: ctx.flash('updateError'),
      flashUpdateSuccess: ctx.flash('updateSuccess'),
      flashRegisterSuccess: ctx.flash('registerSuccess'),
      flashPasswordUpdateError: ctx.flash('passwordUpdateError'),
      flashPasswordUpdateSuccess: ctx.flash('passwordUpdateSuccess'),
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
  const id = ctx.cookies.get('id')
  const role = await queries.getUserById(id)
  if (role[0]['role'] === 'admin') {
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
*/

router.post('/users/update', async (ctx) => {
  const update = await queries.updateUser(ctx.request.body)
  if (update === false) {
    ctx.flash('updateError', 'User update failed')
    ctx.redirect('/users/')
  } else {
    ctx.flash('updateSuccess', 'User update successful')
    ctx.redirect('/users/')
  }
})

router.post('/auth/register', async (ctx) => {
  const register = await queries.addUser(ctx.request.body)
  if (register === false) {
    ctx.flash('registerError', 'Registration failed')
    ctx.redirect('/auth/register')
  } else {
    ctx.flash('registerSuccess', 'Registration successful')
    ctx.redirect('/users/')
  }
})

router.post('/password/change', async (ctx) => {
  const update = await queries.updateUserPassword(ctx.request.body)
  if (update === false) {
    ctx.flash('passwordUpdateError', 'Password update error')
    ctx.redirect('/users/')
  } else {
    ctx.flash('passwordUpdateSuccess', 'Password updated successfully')
    ctx.redirect('/users/')
  }
})

router.post('/auth/login', async (ctx) => {
  return passport.authenticate('local', (err, user, info, status) => {
    if (user) {
      if (user.status === 'Blocked') {
        ctx.flash('userBlocked', 'You\'re blocked, ha-ha-ha!')
        ctx.redirect('/')
      } else if (user.status === 'Active') {
        ctx.cookies.set('id', user['id'])
        ctx.login(user)
        ctx.flash('userLoginSuccessful', 'Welcome')
        ctx.redirect('/')
      }
    } else {
      ctx.flash('userLoginError', 'Login failed. Try again with another e-mail or password')
      ctx.redirect('/')
    }
  })(ctx)
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

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})

module.exports = server
