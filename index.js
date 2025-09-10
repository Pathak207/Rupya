const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const changePinRoutes = require('./routes/changePin.routes');
const verifyPinRoute = require('./routes/verify-pin');
const forgetPinRoutes = require('./routes/forget-pin');
const walletRoutes = require('./routes/walletRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const cors = require('cors');

const app = express();


connectDB();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/change-pin', changePinRoutes);
app.use('/api/verify-pin', verifyPinRoute);
app.use('/api/forget-pin', forgetPinRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/doctor', doctorRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
