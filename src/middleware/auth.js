const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        // console.log(token)
        const decoded = jwt.verify(token, 'marvelUniverse')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if(!user){
            throw new Error('Not Authonticated User')
        }

        req.token = token
        req.user = user
        next()
    } catch(e) {
        console.log(e)
        res.status(401).send({
            message: 'Not Autonticated User.'
        })
    }
}

module.exports = auth