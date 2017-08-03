const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Create the local strategy
passport.use(User.createStrategy());

// Tell it what to do with the strategy
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
