const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Comment = require('./comment')
// const encrypt = require('mongoose-encryption')
require('dotenv').config()

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age must be a positive number.')
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Not valid email')
            }
        }
    },
    password: {
        type: String,
        required: false,
        minlength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Password can not contains "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

}, {
    timestamps: true
})

// userSchema.virtual('comments', {
//     ref: 'Comment',
//     localField: '_id',
//     foreignField: 'owner'
// })

/*
Συνάρτηση η οποία χρησιμοποιείται για να ελέγξουμε αν υπάρχει ο χρήστης με τα παρακάτω στοιχεία.
Αν υπάρχει επιστρέφουμε όλο το αντικείμενο User
*/
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: email })

    if(!user) { 
        throw new Error('Unable to Login.')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error('Unable to Login')
    }

    return user
}

/*
Για λόγους ασφαλείας όταν πραγματοποιείται είσοδος χρήστη (login) δημιουργείται ένα token (μια συμβολοσειρά με τυχαίους χαρακτήρες) το οποίο απόθηκεύεται στο 
αντίστοιχο πεδίο του model με σκοπό κάθε φορά που γίνεται κάποιο request μεταξύ server και client να χρησιμοποιείται αυτό το token ως ανανωριστικό για να μη χρειάζεται
συνεχώς να στέλνει ο χρήστης το email και τον κωδικό του για να γίνεται η ταυτοποίηση.
*/
userSchema.methods.generateAuthToken = async function () {
    const user = this

    const token = jwt.sign({ _id: user._id.toString() }, 'marvelUniverse')

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

/*
Κρυπτογράφηση του κωδικού μέσω της βιβλιοθήκης bcrypt ώστε να μην αποθηκεύεται ο κωδικός σαν plain text στη βάση.
Το pre είναι δεσμευμένη λέξη της mongoose και η δουλειά που κάνει είναι πριν γίνει οποιοδήποτε save() (*παρατηρείται router του user σε πιθανή αλλαγή κωδικού)
να ελέγχει αν έχει αλλάξει ο κωδικός ώστε να αποθηκεύση το κατάλληλο hash του στη βάση.
*/
userSchema.pre('save', async function (next) {
    const user = this

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

/*
Πριν εκτελεστεί η εντολή remove() (πχ στη διαγραφή του χρήστη) βρίσκει όλα τα comments τα οποία έχει δημοσιεύσει και τα διαγράφει (*ίσως και να μη τη χρειαστούμε αυτή)
*/
userSchema.pre('remove', async function (next) {
    const user = this
    await Comment.deleteMany({ owner: user._id })
    
    next()
})

// var encKey = process.env.PASS;
// var sigKey = process.env.SIG;
var secret = process.env.SECRET

// userSchema.plugin(encrypt, {
//     secret: secret,
//     encryptedFields: ['password', 'name', 'age'],
//     additionalAuthenticatedFields: ['email']
// })

// userSchema.plugin(encrypt.migrations, {
//     secret: secret,
//     encryptedFields: ['name', 'age'],
//     additionalAuthenticatedFields: ['email', 'tokens', 'timestamps', 'password']
// })

const User = mongoose.model('User', userSchema)

module.exports = User