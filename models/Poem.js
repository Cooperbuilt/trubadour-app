const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const poemSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a poem name.'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    text: String,
    form: String,
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define indexes for Mongo
poemSchema.index({
    name: 'text',
    description: 'text'
});

// Define indexes for Mongo
poemSchema.index({
    name: 'text',
    tags: 'text'
});

// Sets the url slug to the poem name when the name is changed
poemSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;
    }
    this.slug = slug(this.name);
    // Find other stores that have the same slug and change accordingly
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const poemsWithSlug = await this.constructor.find({ slug: slugRegEx })
    if(poemsWithSlug.length) {
        this.slug = `${this.slug}-${poemsWithSlug.length + 1}`;
    }
    next();
});

poemSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};


// Find comments where the poems _id === comments on the poem property
poemSchema.virtual('comments', {
    ref: 'Comment', // What model to link
    localField: '_id', // Which field on the poem?
    foreignField: 'poem' // Which field on the comment schema?
});

function autopopulate(next) {
    this.populate('comments');
    next();
}

poemSchema.pre('find', autopopulate);
poemSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Poem', poemSchema);
