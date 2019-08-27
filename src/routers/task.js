const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req,res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send({
            message: 'Task Created.'
        })
    } catch(e) {
        res.status(500).send(e)
    }
    
})

// GET /tasks/my?completed=true
// GET /tasks/my?limit=10&skip=0
// GET /tasks/my?sortBy=createdAt_desc
router.get('/tasks/my', auth, async (req,res) => {
    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1].toLowerCase() === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.status(200).send(req.user.tasks)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid Updates'
        })
    }


    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if(!task) { 
            res.status(404).send({
                message: 'Not found task with this id'
            })
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send({
            message: 'Task updated successfuly.'
        })
    } catch(e) {
        res.status(404).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req,res) => {

    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send({
                message: 'Not found task with this id.'
            })
        }

        res.send({
            message: 'Task deleted successfuly'
        })
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router