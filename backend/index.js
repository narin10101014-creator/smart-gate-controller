require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gateRoutes = require('./routes/gateRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
// Trust the first hop of the proxy chain (Railway, or any single reverse
// proxy in front of this app) so req.ip and express-rate-limit see the
// real client IP from X-Forwarded-For instead of the proxy's own address.
// Harmless for local dev - there's no proxy in front, so no
// X-Forwarded-For header is ever sent, and this setting has no effect.
app.set('trust proxy', 1);
app.use(cors({ exposedHeaders: ['Retry-After'] }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', authRoutes);
app.use('/api', gateRoutes);
app.use('/api', logRoutes);

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
