const mongoose = require('mongoose');
const UserModel = require('../../src/models/user');
const TaskModel = require('../../src/models/task')
const jwt = require('jsonwebtoken');

const userOneId = new mongoose.Types.ObjectId
const userOne = {
    _id: userOneId,
    name: 'Budi',
    email: 'Budi@gmail.com',
    password: '13245678',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId
const userTwo = {
    _id: userTwoId,
    name: 'Jess',
    email: 'jess@gmail.com',
    password: '13245678',
    tokens: [{
        token: jwt.sign({_id: userTwoId}, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId,
    description: 'Task One',
    completed: false,
    user: userOne._id
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId,
    description: 'Task Two',
    completed: true,
    user: userOne._id
}

const taskThree = {
    _id: new mongoose.Types.ObjectId,
    description: 'Task Three',
    completed: true,
    user: userTwo._id
}

const beforeEachSetup = async ()=> {
    await UserModel.deleteMany()
    await TaskModel.deleteMany()
    await new UserModel(userOne).save()
    await new UserModel(userTwo).save()
    await new TaskModel(taskOne).save()
    await new TaskModel(taskTwo).save()
    await new TaskModel(taskThree).save()
}

const afterAllSetup = async (done)=> {
    await mongoose.disconnect()
    done()
}

module.exports = {
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    beforeEachSetup,
    afterAllSetup
}