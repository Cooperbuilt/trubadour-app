const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Supresses a false error, can be removed
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mondodbErrorHandler = require('mongoose-mongodb-errors');
// Adds password to schema and handles hashing and auth
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        required: 'Please Supply an Email Address'
    },
    name: {
        type: String,
        required: 'Please Supply a Name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref: 'Poem' }
    ],
    likes: [
        { type: mongoose.Schema.ObjectId, ref: 'Poem' }
    ],
    dislikes: [
        { type: mongoose.Schema.ObjectId, ref: 'Poem' }
    ]
});

// Auth / Password additions
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// Pretty errors for bad auth
userSchema.plugin(mondodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
