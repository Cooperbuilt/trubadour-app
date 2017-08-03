const mongoose = require('mongoose');
mongoose.promise = global.promise;

const commentSchema = new mongoose.Schema({
  created: {
    type: Date,
    defualt: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author!'
  },
  poem: {
    type: mongoose.Schema.ObjectId,
    ref: 'Poem',
    required: 'You must supply a poem!'
  },
  text: {
    type: String,
    required: 'Your comment must have text!'
  }
});

function autopopulate(next) {
  this.populate('author');
  next();
}

commentSchema.pre('find', autopopulate);
commentSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Comment', commentSchema);
