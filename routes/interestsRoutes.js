const express = require('express');
const router = express.Router();
const { getAllInterestCategories } = require('../controllers/interestsController');

router.get('/interests', getAllInterestCategories); 
module.exports = router;
