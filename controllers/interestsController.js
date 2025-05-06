
const InterestCategory = require('../models/interestCategory');

const getAllInterestCategories = async (req, res) => {
  try {
    const categories = await InterestCategory.find({});

    return res.status(200).json({
      code: 200,
      message: 'Interest categories fetched successfully',
      error: null,
      data: categories
    });
  } catch (err) {
    console.error('Get Interest Categories Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to fetch interest categories',
      error: err.message,
      data: null
    });
  }
};

module.exports = { getAllInterestCategories };
