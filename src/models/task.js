const mongoose = require('mongoose');

//Task Model
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    }
}, {
    timestamps: true
})
const TaskModel = mongoose.model('Tasks', taskSchema)

// const task1 = new TaskModel({
//     description: 'Change Tyre',
//     completed: false
// })

// task1.save().then((result)=> {
//     console.log(result)
// }).catch((error)=> {
//     console.log(error)
// })

module.exports = TaskModel