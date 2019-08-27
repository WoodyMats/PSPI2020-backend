require('../src/db/mongoose')
const User = require('../src/models/user')
const Task = require('../src/models/task')

// User.findByIdAndUpdate('5d5d4ba6833183088c2ecb45', { age: 21 }).then((user) => {
//     console.log(user)
//     return User.countDocuments({ age: 21 })
// }).then((result) => {
//     console.log(result)
// }).catch((err) => {
//     console.log(err)
// })

// Task.findByIdAndDelete('5d5e649c1f3e0d08bbe02615').then((task) => {
//     console.log(task)
//     return Task.countDocuments({ completed: false })
// }).then((result) => {
//     console.log(result)
// }).catch((err) => {
//     console.log(err)
// })

const deleteTaskAndCount = async(id) => {
    const task = await Task.findByIdAndDelete(id)
    const count = await Task.countDocuments({ completed: false })
    return count
}

deleteTaskAndCount('5d5e7ff00287cb059615d1c5').then((count) => {
    console.log(count)
}).catch((err) => {
    console.log(err)
})