const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
    text: {
        type: String,
        trim: true
    }, 
    // owner: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: 'User'
    // },
    user: {
        type: String,
        trim: true,
        default: "Guest User " + Math.floor(Math.random() * Math.floor(Date.now()))
    }
}, {
    timestamps: true
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment