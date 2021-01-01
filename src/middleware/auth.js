const jwt = require('jsonwebtoken');
const UserModel = require('../models/user')

const auth = async (req, res, next)=> {
    try {
        const token = req.header('Authorization').replace('Bearer ', '') //get authorization header value, remove bearer string (Bearer token)
        const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET) //decode token with key
        const user = await UserModel.findOne({ _id: tokenDecoded._id, 'tokens.token': token }) //find user on db that log in

        if(!user) {
            throw new Error()
        }
        req.token = token
        req.user = user //store logged in user on request parameter
        next() //proceed to router
    } catch(e) {
        res.status(401).send({error: 'Authenticate fail'})
    }
}

module.exports = auth