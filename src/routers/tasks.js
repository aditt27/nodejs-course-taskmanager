const express = require('express');
const TaskModel = require('../models/task')
const authmw = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', authmw, async (req, res)=> {
    const task = new TaskModel({
        ...req.body, //es6 spread syntax
        user: req.user._id
    })

    try {
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }

    // task.save().then((result)=> {
    //     res.status(201).send(result)
    // }).catch((error)=> {
    //     res.status(400).send(error)
    // })
})

router.get('/tasks', authmw, async (req, res)=> {
    try {
        //cara1
        //const tasks = await TaskModel.find({user: req.user._id})
        //res.send(tasks)

        //cara2 (userschema virtual tasks di user)

        //filter by completed
        const match = {}
        if(req.query.completed) {
            match.completed = req.query.completed === 'true' //nilai match.completed adalah boolean sesuai condition req.query.completed === 'true' 
        }

        //sorting
        const sort = {}
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'asc' ? 1 : -1 //ternary operator
        }

        await req.user.populate({
            path: 'tasks',
            match,
            // match: {
            //     completed: true
            // }
            options: {
                //pagination limit skip
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort //query.prototype.sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

    } catch(e) {
        res.status(500).send()
    }

    // TaskModel.find().then((result)=> {
    //     res.send(result)
    // }).catch((error)=> {
    //     res.status(500).send()
    // })
})

router.get('/tasks/:id', authmw, async (req, res)=> {
    try {
        //cari task berdasarkan id task dan id user yang buat dan sedang login
        //berdasarkan id user yang buat dan sedang login biar user lain gabisa akses
        const task = await TaskModel.findOne({_id: req.params.id, user: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }

    // TaskModel.findById(req.params.id).then((result)=> {
    //     if(!result) {
    //         return res.status(404).send()
    //     }
    //     res.send(result)
    // }).catch((error)=> {
    //     res.status(500).send()
    // })
})

router.patch('/tasks/:id', authmw, async (req, res)=> {

    //cek apakah field update sesuai schema
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid Update Field'})
    }

    try {
        //const task = await TaskModel.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

        //ganti dari pake findbyidandupdate biar middlewarenya masuk (karena fungsi update di mongoose bypass middleware)
        const task = await TaskModel.findOne({_id: req.params.id, user: req.user._id})
        if(!task) {
            return res.status(404).send()
        }

        updates.forEach((field)=> {
            task[field] = req.body[field]
        })
        await task.save()

        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

router.delete('/tasks/:id', authmw, async (req, res)=> {

    try {
        const task = await TaskModel.findOneAndDelete({_id: req.params.id, user: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

module.exports = router