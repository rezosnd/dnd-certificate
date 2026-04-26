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
    origin: [FRONTEND_URL, 'https://dnd.veritasco.tech', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    exposedHeaders: ['x-participant-name', 'x-certificate-id', 'X-Participant-Name', 'X-Certificate-ID', 'Content-Disposition', 'content-disposition']
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

// Dynamic Social Sharing Route
app.get('/share/:certId', async (req, res) => {
    const { certId } = req.params;
    try {
        // Search by certificateId, not DB id
        const result = await sql`SELECT * FROM users WHERE "certificateId" = ${certId}`;
        
        if (result.length === 0) {
            console.log(`❌ Share query failed: Certificate ${certId} not found`);
            return res.status(404).send('Certificate Not Found');
        }
        
        const user = result[0];
        const backendUrl = process.env.BACKEND_URL || `https://${req.get('host')}`;
        const rawFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
        const cleanFrontend = `https://${rawFrontend.replace(/^(https?[:/]+)+/i, '').replace(/\/+$/, '')}`;
        
        // This HTML is only for bots (LinkedIn/WhatsApp). Humans are redirected.
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Verified Certificate - ${user.name}</title>
                <meta property="og:title" content="Verified Certificate | ${user.name}" />
                <meta property="og:description" content="Official certificate of participation for Decode & Dominate 2.0 finale." />
                <meta property="og:image" content="${backendUrl}/generate?email=${encodeURIComponent(user.email)}&img=.jpg" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="${cleanFrontend}/verify/${certId}" />
                <meta name="twitter:card" content="summary_large_image" />
                <script>window.location.href = "${cleanFrontend}/verify/${certId}";</script>
            </head>
            <body>Redirecting to verification page...</body>
            </html>
        `);
    } catch (err) {
        console.error('Share Route Error:', err);
        res.redirect(process.env.FRONTEND_URL || '/');
    }
});

// Root route for health check
app.get('/', (req, res) => {
    res.json({ message: 'Decode & Dominate 2.0 API is running! 🚀' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
