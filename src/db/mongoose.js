const mongoose = require('mongoose')
const connectionURL = 'mongodb://127.0.0.1:27017/task-manager-api'
const User = require('../models/user')


mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})

const db = mongoose.connection

db.on('Error', console.error.bind(console, "MongoDB connection Error"))
db.once('open', function (callback) {
    console.log('Successfully connected to MongoDB!')
})

// User.migrateToA(function (err) {
//     if(err) {
//         throw err
//     }

//     console.log('Migration successful!')
// })