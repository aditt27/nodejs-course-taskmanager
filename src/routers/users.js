const express = require('express');
const UserModel = require('../models/user');
const authmw = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp')

const router = new express.Router()

//create new user (sign up)
router.post('/users', async (req, res)=> {
    const user = new UserModel(req.body)

    try {
        const token = await user.generateAuthToken()
        user.tokens = user.tokens.concat({token: token})

        await user.save()

        res.status(201) //Created
        res.send({ user: user.getPublicProfile(), token })
    } catch(e) {
        res.status(400) //Bad Request
        res.send(e)
    }

    //Ganti dari promise ke async/await

    // user.save().then((result)=> {
    //     res.status(201) //Created
    //     res.send(result)
    // }).catch((error)=> {
    //     res.status(400) //Bad Request
    //     res.send(error)
    // })
})

//login user
router.post('/users/login', async (req, res)=> {
    try {
        //find user and verify
        const user = await UserModel.findByCredentials(req.body.email, req.body.password)
        //generate jwt token on user
        const token = await user.generateAuthToken()
        //save user token to database
        user.tokens = user.tokens.concat({token: token})
        await user.save()

        res.send({ user: user.getPublicProfile(), token })
    } catch(e) {
        res.status(400).send({msg: "Incorrect username or password"})
    }
})

//logout user
//delete token on the db that has the same token that want to logout
router.post('/users/logout', authmw, async (req, res)=> {
    try {
        req.user.tokens = req.user.tokens.filter((token)=> {
            return token.token !== req.token
        })
        await req.user.save()
        res.send({msg: 'Logout success'})
    } catch {
        res.status(500).send()
    }
})

//logout user from all device
//delete all token to logout all
router.post('/users/logoutAll', authmw, async (req, res)=> {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({msg: 'Logout All success'})
    } catch {
        res.status(500).send()
    }
})

//get user profile
router.get('/users/me', authmw, async (req, res)=> {
    res.send(req.user.getPublicProfile())
})

//update profile
router.patch('/users/me', authmw, async (req, res)=> {

    //cek apakah field update sesuai schema
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid Update Field'})
    }

    try {
        //update user data sesuai yang ingin diubah
        updates.forEach((field)=> {
            req.user[field] = req.body[field]
        })
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(500).send()
    }
})

//delete user self
router.delete('/users/me', authmw, async (req, res)=> {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch(e) {
        res.status(500).send()
    }
})

//upload profile avatar
const uploadAva = multer({ //upload file library
    //dest: 'avatar/', //gapake destination biar filenya lanjut ke req
    limits: {
        fileSize: 5000000  //5MB
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) { //regex regex101.com
            return cb(new Error("Unsupported File Types"))
        }
        cb(undefined, true)
    }
})
router.post('/users/me/avatar', authmw, uploadAva.single('avatar'), async (req, res)=> { //multiple middleware
    const editedBuffer = await sharp(req.file.buffer).png().toBuffer() //image formatting library
    req.user.avatar = editedBuffer
    await req.user.save()
    res.send()
}, (error, req, res, next)=> { //express middleware error handling
    res.status(400).send({error: error.message})
})

//delete profile avatar
router.delete('/users/me/avatar', authmw, async (req, res)=> {
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me/avatar', authmw, async (req, res)=> {
    try {
        const user = req.user
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.end(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

router.get('/users/:id/avatar', async (req, res)=> {
    try {
        const user = await UserModel.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

//read specific user
// router.get('/users/:id', authmw, async (req, res)=> {
//     try {
//         const user = await UserModel.findById(req.params.id)
//         if(!user) {
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch(e) {
//         console.log(e)
//         res.status(500).send()
//     }

//     // UserModel.findById(req.params.id).then((result)=> {
//     //     if(!result) {
//     //         return res.status(404).send()
//     //     }
//     //     res.send(result)
//     // }).catch((error)=> {
//     //     res.status(500).send()
//     // })
// })

//get all user
// router.get('/users', authmw, async (req, res)=> {
//     try {
//         const users = await UserModel.find()
//         res.send(users)
//     } catch(e) {
//         res.status(500).send()
//     }

//     // UserModel.find().then((result)=> {
//     //     res.send(result)
//     // }).catch((error)=> {
//     //     res.status(500).send()
//     // })
// })

//update specific user
// router.patch('/users/:id', authmw, async (req, res)=> {

//     //cek apakah field update sesuai schema
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
//     if(!isValidOperation) {
//         return res.status(400).send({error: 'Invalid Update Field'})
//     }

//     try {
//         //const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

//         //ganti dari pake findbyidandupdate biar middlewarenya masuk (karena fungsi update di mongoose bypass middleware)
//         const user = await UserModel.findById(req.params.id)
//         if(!user) {
//             return res.status(404).send()
//         }

//         updates.forEach((field)=> {
//             user[field] = req.body[field]
//         })
//         await user.save()

//         res.send(user)
//     } catch(e) {
//         res.status(500).send()
//     }
// })

//delete specific user
// router.delete('/users/:id', authmw, async (req, res)=> {

//     try {
//         const user = await UserModel.findByIdAndDelete(req.params.id)
//         if(!user) {
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch(e) {

//         res.status(500).send()
//     }
// })

module.exports = router