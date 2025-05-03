
const InterestCategory = require('../models/interestCategory');

const getAllInterestCategories = async (req, res) => {
  try {
    const categories = await InterestCategory.find({});
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllInterestCategories };
