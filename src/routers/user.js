const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs')

/*
Δέχεται ως όρισμα ένα object τύπου user, δημιουργεί ένα αντίστοιχο αντικείμενο και αφού δημιουργήσει το token αποθηκεύει τον user στη βάση
**Βλέπε αρχείο (../models/user)
*/
router.post('/users/signup', async (req, res) => {
    const user = new User(req.body)

    try {
        //await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ 
            message: 'User Created.',
            token: token
         })
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({ user, token })
    } catch(e) {
        res.status(400).send({
            error: 'Unable to Login!'
        })
    }
})

/*
Διαγράφει το token το οποίο χρησιμοποιεί ο συγκεκριμένος user για τα request του, μη μπορόντας να κάνει πλέον άλλο request εκτός και αν ξανακάνει login
*/
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.status(200).send({
            message: 'Logout Successfuly.'
        })
    } catch(e) {
        res.status(500).send(e)
    }
})

/*
!!Δεν θα τη χρειαστούμε!!
Μόνο για σκοπούς testing ΙΣΩΣ!
*/
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
    req.user.tokens = []

    await req.user.save()

    res.status(200).send({
        message: 'Logout Successfuly.'
    })
    } catch(e) {
        res.status(500).send(e)
    }
})

/*
Δίνοντας τα κατάλληλα στοιχεία (χρήση του token) παίρνουμε πίσω τον συγκεκριμένο user (Κάτι σαν να παίρνουμε το profile)
*/
router.get('/users/me', auth, async (req,res) => {
    res.send(req.user)
})

/*
Αυτό το call επεξεργάζεται τον user. Είναι αντίστοιχο με το patch στον router του comment.
*/
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({
            error: 'Invalid Updates'
        })
    }
    
    
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })    

        await req.user.save()
        res.send({
            message: 'User Updated.'
        })
    } catch(e) {
        res.status(400).send(e)
    }
})

/*
Βρίσκει αν υπάρχει ο χρήστης και αν μπορεί να διαγραφεί (μέσω της auth) και διαγράφει τον χρήστη αφού πρώτα διαγράψει τα comments που έχουν γίνει από αυτόν
 **Βλέπε: (../models/user) τη συνάρτηση pre('remove')
*/
router.delete('/users/me', auth, async (req,res) => {

    try {
        await req.user.remove()
        res.send({
            message: 'User deleted successfuly'
        })
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router