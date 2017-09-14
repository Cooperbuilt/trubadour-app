const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// Passport -- local strategy
exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login',
    successRedirect: '/',
    successFlash: 'You Have Logged In!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You Are Now Logged Out');
    res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
    // Is the User authenticated?
    if(req.isAuthenticated()) {
        next(); // Carry On!
        return;
    }
    req.flash('error', 'Oops, you need to be logged in for that!');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    // Check if the user exists
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        // If no email, send success anyways to avoid phishing
        req.flash('success', 'A password reset has been mailed to you');
        return res.redirect('/login');
    }
    // Set reset tokens and expiry on account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // One Hour from Now
    await user.save();
    // Send email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'
    });
    req.flash('success', 'A password reset has been mailed to you')
    // Redirect to login page
    res.redirect('/login');
}

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    // No user found in the DB
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expried');
        return res.redirect('/login');
    }
    // User is found in the DB, show reset form
    res.render('reset', { title: 'Reset your Password' });
};


exports.confirmPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expried!');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updateUser = await user.save();
    await req.login(updateUser);
    req.flash('success', 'Your password is reset!');
    res.redirect('/');
}
