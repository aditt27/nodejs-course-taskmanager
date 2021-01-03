const request = require('supertest')
const app = require('../src/app')
const TaskModel = require('../src/models/task')
const {userOneId, userOne, userTwo, taskOne, beforeEachSetup, afterAllSetup} = require('./fixtures/db.js')

beforeEach(beforeEachSetup)
afterAll(afterAllSetup)

test('Create new task for user', async ()=> {
    const response = await request(app).post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'New task from jest test'
        })
        .expect(201)

    //Assert new task in database
    const task = await TaskModel.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Get all tasks from user', async ()=> {
    const response = await request(app).get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)

    //Assert 2 tasks in response
    expect(response.body.length).toEqual(2)
})

test('Fail when delete task not belong to the user', async ()=> {
    await request(app).delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .expect(404)

    //Assert task still in database
    const task = await TaskModel.findById(taskOne._id)
    expect(taskOne).not.toBeNull()
})