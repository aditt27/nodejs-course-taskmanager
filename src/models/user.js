const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TaskModel = require('../models/task')

//User Model
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true, //gaboleh ada email duplikat
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        }
    },
    password: {
        type: String,
        minlength:7,
        trim: true,
        required: true,
        validate(value){
            if(value.toLowerCase().includes('password')) {
                throw new Error('Invalid Password')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        min: [0, 'Invalid Age']
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar : {
        type: Buffer
    }
}, {
    timestamps: true
})

//membuat relationship antara user dengan task
userSchema.virtual('tasks', {
    ref: 'Tasks', //ngarah ke taskmodel
    localField: '_id', //ngarah ke field _id di user
    foreignField: 'user' //ngarah ke field user di task
})

//created new static method on User model
userSchema.statics.findByCredentials = async (email, password)=> {
    const user = await UserModel.findOne({email})

    if(!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

userSchema.methods.getPublicProfile = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.tokens
    delete userObject.password
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    return token
}

//semua userSchema.pre pake async function dan fungsi utamanya pake await
//do something before saving data to database
//hash password from plain text
userSchema.pre('save', async function() {
    const user = this
    //cek apakah field password yang di set/update
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
})

//remove all task related to user when user removed
userSchema.pre('remove', async function() {
    const user = this
    await TaskModel.deleteMany({user: user._id})
})

const UserModel = mongoose.model('Users', userSchema)

// const me = new UserModel({
//     name: 'Aditya Budi  ',
//     password: '13245678',
//     email: 'ADIttBUDI@Gmail.Com',
//     age: 12
// })

// me.save().then((result)=> {
//     console.log(result)
// }).catch((error)=> {
//     console.log(error)
// })

module.exports = UserModel