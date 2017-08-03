const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');

exports.addComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.poem = req.params.id;
  const newComment = new Comment(req.body);
  await newComment.save();
  req.flash('success', 'Comment Posted!');
  res.redirect('back');
}
