const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


exports.loginForm = (req, res) => {
    res.render('login', { title: 'Log In' });
};

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'});
};

// Validaiton middleware
exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'This email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        removeExtension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirm cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return; // Stop from running
    }
    next(); // Move to the next middleware
};

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next(); // Pass to authController
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        // Can add more fields here
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, context: 'query' }
    );
    req.flash('success', 'Successfully Updated Account!');
    res.redirect('back');
};

