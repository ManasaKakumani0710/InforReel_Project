const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/dbconfig');
const userRoutes = require('./routes/userRoutes');
const insertStaticInterests = require('./scripts/insertInterests');
const identityRoutes = require('./routes/identityRoutes');
const payments =require('./routes/paymentRoutes');
const interests=require('./routes/interestsRoutes')

dotenv.config();
const app = express();
connectDB();

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/payments',payments);
app.use('/api', interests);


app.get('/reset-password', (req, res) => {
    const { token } = req.query;
    res.json({ message: 'Please provide a new password.', token }); 
  });

insertStaticInterests();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
