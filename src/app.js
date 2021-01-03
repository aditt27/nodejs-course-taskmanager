const express = require('express');
require('./db/mongoose')

const UsersRouter = require('./routers/users')
const TasksRouter = require('./routers/tasks')

const app = express()

//Maintenance mode
// app.use((req, res, next)=> {
//     res.status(503).send('Maintenance mode. all requests disabled')
// })

app.use(express.json()) //parse incoming requests with JSON payloads.

//Add url route to app
app.use(UsersRouter)
app.use(TasksRouter)

module.exports = app

