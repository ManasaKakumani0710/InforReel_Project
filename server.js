const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/dbconfig');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
connectDB();

app.use(express.json());
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
