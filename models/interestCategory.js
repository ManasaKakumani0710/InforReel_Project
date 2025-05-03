const mongoose = require('mongoose');

const interestCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  }
}, { collection: 'interestCategories' });

module.exports = mongoose.model('InterestCategory', interestCategorySchema);