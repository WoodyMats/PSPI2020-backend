const express = require('express')
const Comment = require('../models/comment')
const auth = require('../middleware/auth')
const router = new express.Router()

/*
Σε αυτό το call γίνεται η δημοσίευση ενός σχολίου (αποθήκευση comment στη βάση)
παίρνει το body που έρχεται σε μορφή json (το cooment ουσιαστικά), δημιουργεί ένα αντικείμενο τύπου Comment
*/
router.post('/comment', auth, async (req,res) => {
    // const task = new Task(req.body)
    const comment = new Comment({
        ...req.body,
        owner: req.user._id
    })

    try {
        await comment.save()
        res.status(201).send({
            message: 'Comment Created.'
        })
    } catch(e) {
        res.status(500).send(e)
    }
    
})

router.get('/comments/my', auth, async (req,res) => {
    const match = {}
    const sort = {}
    
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1].toLowerCase() === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'comments',
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

/*
Call για edit ενός comment με βάση το _id (το μοναδικό id που δίνει σε κάθε εγγραφή η MongoDB by default)
Το allowUpdates είναι τα πεδία τα οποία επιδέχονται επεξεργασία. **Προφανώς στο comment είναι μόνο το πεδίο text καθώς το πεδίο owner
δεν μπορεί να αλλαχθεί.
*/
router.patch('/comments/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['text']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid Updates'
        })
    }

    try {
        const comment = await Comment.findOne({ _id: req.params.id, owner: req.user._id })

        if(!comment) { 
            res.status(404).send({
                message: 'Not found task with this id'
            })
        }

        updates.forEach((update) => comment[update] = req.body[update])
        await comment.save()
        res.send({
            message: 'Comment updated successfuly.'
        })
    } catch(e) {
        res.status(404).send(e)
    }
})

/*
Σε αυτό το call γίνεται η διαγραφή ενός comment με βάση και πάλι το id του. Όπως θα παρατηρήσετε πριν τη συνάρτηση 'async (req,res)' υπάρχει ένα middleware
που ονομάζεται auth και αυτό που κάνει είναι να ελέγχει αν η ενέργεια που πάει να εκτελεστεί γίνεται από κάποιον χρήστη (Αν δηλαδή ο χρήστης είναι logged in)
αλλά και αν είναι ο σωστός χρήστης καθώς ο κάθε χρήστης μπορεί να διαγράψει και να επεξεργαστεί μόνο δικά του σχόλια και όχι άλλων χρηστών ακόμη και αν με 
κάποιο τρόπο έχει τα _id αυτών.
    **Σημείωση1: Middleware είναι ουσιαστικά μια ενδιάμεση συνάρτηση η οποία μόλις τρέξει μπορεί να συνεχίσει η εκτέλεση (στην προκειμένη περίπτωση να διαγραφεί το σχόλιο)
    **Σημείωση2: Η auth βρίσκεται μέσα στο model του User.
*/
router.delete('/comments/:id', auth, async (req,res) => {

    try {
        const comment = await Comment.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if(!comment) {
            return res.status(404).send({
                message: 'Not found comment with this id.'
            })
        }

        res.send({
            message: 'Comment deleted successfuly'
        })
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router