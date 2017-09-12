const mongoose = require('mongoose');
const Poem = mongoose.model('Poem');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');

const multerOptions = {
    // Save into memory so we save the resized version
    // Instead of the massive files people upload
    storage: multer.memoryStorage(),
    filefilter(req, file, next) {
        // Either yes this file type is accepted and pass it on
        // Or no, and kick an error
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That filetype is not allowed!' }, false);
        }
    }
}

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addPoem = (req, res) => {
    res.render('editPoem', { title: 'Add a Poem' });
}

// Reads file into memory but DOES NOT store it
exports.upload = multer(multerOptions).single('photo');

// Resize the photos
exports.resize = async (req, res, next) => {
    // Check to see if there is no new file to resize
    if (!req.file) {
        next(); // Skip to next middleware
        return;
    }
    // Pull just the file extension
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // Now resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // Now that the photo is saved to disk, keep going!
    next();
};


exports.createPoem = async (req, res) => {
    req.body.author = req.user._id;
    const poem = await (new Poem(req.body)).save();
    await poem.save();
    req.flash('success', `Successfully Added "${poem.name}." Care to leave a comment?`);
    res.redirect(`/poems/${poem.slug}`);
};

exports.getPoems = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
    // Query the DB for a list of all poems
    const poemsPromise = Poem
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' })

    const countPromise = Poem.count();

    const [poems, count] = await Promise.all([poemsPromise, countPromise]);

    const pages = Math.ceil( count / limit );
    if (!poems.length && skip) {
        req.flash('info', `You asked for page ${page}, but it doesn't exist. We have redirected you to ${pages}`);
        res.redirect(`/poems/page/${pages}`);
        return;
    }
    res.render('poems', { title: 'Poems', poems, page, pages, count });
};

const confirmAuthor = (poem, user) => {
    if (!poem.author.equals(user._id)) {
        throw Error('You must be the author in order to edit a poem');
    }
};

exports.editPoem = async (req, res) => {
    // Find the Poem with the ID
    const poem = await Poem.findOne({ _id: req.params.id });
    // confirm they are the owner of the Poem
    confirmAuthor(poem, req.user);
    // Render out the edit form so the user can update the poem
    res.render('editPoem', { title: `Edit ${poem.name}`, poem });
};

exports.updatePoem = async (req, res) => {
    // Find and update poem
    const poem = await Poem.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();
    // Redirect them to the store and tell them it worked
    req.flash('success', `Successfully updated "${poem.name}". <a href="/poems/${poem.slug}"> View Poem →`);
    res.redirect(`/poems/${poem._id}/edit`);
};

exports.getPoemBySlug = async (req, res, next) => {
    const poem = await Poem.findOne({ slug: req.params.slug }).populate('author comments');
    // Check if there is no store at that slug
    if(!poem) {
        return next();
    } else {
        res.render('poem', { poem, title: poem.name });
    }
};

// Searches poems by name || description || tags
// Assigns score based on meta data
// Returns in descending order via a json payload
exports.searchPoems = async (req, res) => {
    const poems = await Poem
    // Find poems that match
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore' }
    })
    // Sort by meta data score (from Mongo)
    .sort({
        score: { $meta: 'textScore' }
    })
    // Return the top 10
    .limit(10);
    res.json(poems)
};

exports.heartPoem = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
        { [operator]: { hearts: req.params.id }},
        { new: true }
    );
};

exports.getPoemsByTags = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };

    const tagsPromise = Poem.getTagsList();
    const storesPromise = Poem.find({ tags: tagQuery });
    const [tags, poems] = await Promise.all([tagsPromise, storesPromise]);

    res.render('tag', { tags, title: 'Explore by Qualities', tag, poems });
};

exports.getFavorites = async (req, res) => {
    // Query the DB for a list of favorites
    const poems = await Poem.find({
        _id: {$in: req.user.hearts }
    });
    res.render('poems', {title: 'My Favorite Poems', poems })
};
