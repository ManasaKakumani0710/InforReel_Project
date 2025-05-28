 
const mongoose = require('mongoose');

const reportedCompanySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyUserId:{type:String,required:true},
  reportedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReportedCompany', reportedCompanySchema);
