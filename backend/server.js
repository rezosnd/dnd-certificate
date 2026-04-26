require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('./config/db');

const generateRoute = require('./routes/generate');
const verifyRoute = require('./routes/verify');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    exposedHeaders: ['X-Participant-Name', 'X-Certificate-ID', 'Content-Disposition']
}));
app.use(express.json());

// Test database connection
async function connectDB() {
    try {
        await sql`SELECT 1`;
        console.log('✅ PostgreSQL Connected');
    } catch (err) {
        console.error('❌ Database Connection Error:', err);
    }
}
connectDB();

app.use('/generate', generateRoute);
app.use('/verify', verifyRoute);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
