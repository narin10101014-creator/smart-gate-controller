require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gateRoutes = require('./routes/gateRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', authRoutes);
app.use('/api', gateRoutes);
app.use('/api', logRoutes);

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
