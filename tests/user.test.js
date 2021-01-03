//npm test to run the test
const request = require('supertest')
const app = require('../src/app')
const UserModel = require('../src/models/user')
const {userOneId, userOne, beforeEachSetup, afterAllSetup} = require('./fixtures/db.js')

beforeEach(beforeEachSetup)
afterAll(afterAllSetup)

test('Sign up new user', async ()=> {
   const response = await request(app).post('/users').send({
        name: 'Ahmad',
        email: 'ahmad@gmail.com',
        password: '13245678'
    }).expect(201)

    //Assert user stored in database
    const userCreated = await UserModel.findById(response.body.user._id)
    expect(userCreated).not.toBeNull()


    //Assert response body
    expect(response.body).toMatchObject({
        user: {
            name: 'Ahmad',
            email: 'ahmad@gmail.com'
        },
        token: userCreated.tokens[0].token
    })

    //Assert password not stored plain text
    expect(userCreated.password).not.toBe('13245678')
})

test('Login existing user', async ()=> {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //Assert new token response match in database after login
    const user = await UserModel.findById(userOne._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Fail when login with bad credentials', async ()=> {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: '1324!!'
    }).expect(400)
})

test('Get profile data', async ()=> {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Fail when unauthenticated user get profile data', async()=> {
    await request(app).get('/users/me')
        .send()
        .expect(401)
})

test('Delete user account', async ()=> {
    await request(app).delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    //Assert user removed
    const user = await UserModel.findById(userOne._id)
    expect(user).toBeNull()
})

test('Fail when unauthenticated user delete user account', async ()=> {
    await request(app).delete('/users/me')
        .send()
        .expect(401)
})

test('Upload user avatar image', async ()=> {
    await request(app).post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/nyeeh.jpg')
        .expect(200)

    //Assert image binary data stored in database
    const user = await UserModel.findById(userOne._id)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Update user data', async ()=> {
    await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Budi Laksono'
        })
        .expect(200)

    //Assert user name changed
    const user = await UserModel.findById(userOne._id)
    expect(user.name).toBe('Budi Laksono')
})

test('Fail update invalid user data field', async ()=> {
    await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Jakarta' //invalid field on user schema
        })
        .expect(400)

    //Assert undefined locaiton field
    const user = await UserModel.findById(userOne._id)
    expect(user.location).toBeUndefined()
})