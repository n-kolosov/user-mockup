// seeding database with admin user. Username is admin@goods.ru, password is qwerty
exports.seed = function (knex, Promise) {
  return knex('users').del()
    .then(function () {
      return knex('users').insert([
        { id: 1,
          firstName: 'admin',
          lastName: 'admin',
          username: 'admin@goods.ru',
          password: '$2a$10$46apv2F4.h8OCNOJXf/vneHL7ADAe5kQAbDYcK.3gMd0KIXwDPILG',
          role: 'admin',
          status: 'Active'
        }
      ])
    })
}
