const express = require('express');
const router = express.Router();
const sql = require('../config/db');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            return res.status(404).json({ message: 'No record found ❌' });
        }

        const user = users[0];
        let { certificateId, certificateGenerated } = user;

        // If not generated, generate new ID
        if (!certificateGenerated) {
            // Generate simple random suffix (4 alphanumeric chars)
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            certificateId = `KF-DD2-2026-${randomSuffix}`;
            
            await sql`
                UPDATE users 
                SET "certificateId" = ${certificateId}, "certificateGenerated" = true, "updatedAt" = CURRENT_TIMESTAMP
                WHERE id = ${user.id}
            `;
            
            user.certificateId = certificateId;
            user.certificateGenerated = true;
        }

        // Generate QR Code
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyLink = `${frontendUrl}/verify/${certificateId}`; // frontend link
        const qrDataUrl = await QRCode.toDataURL(verifyLink, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Load the HTML template
        const templatePath = path.join(__dirname, '..', '..', 'certificate_template.html');
        let htmlSource = fs.readFileSync(templatePath, 'utf8');

        // String replacements based on the template structure
        htmlSource = htmlSource.replace('[Participant Name]', user.name);
        htmlSource = htmlSource.replace('KF-DD2-2026-FINAL', certificateId);
        
        // Use regex to replace the QR code source properly
        // Look for the QR image tag and replace its src
        const qrRegex = /<img src="https:\/\/api\.qrserver\.com\/v1\/create-qr-code[^>]+>/;
        htmlSource = htmlSource.replace(qrRegex, `<img src="${qrDataUrl}" style="width: 110px;">`);

        // Launch Puppeteer to capture as JPEG
        let browser;
        try {
            const isProd = process.env.NODE_ENV === 'production';
            browser = await puppeteer.launch({
                // On production (Linux), we let Puppeteer find its own Chromium or use the path provided by the host
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (isProd ? null : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'),
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();
            
            await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
            await page.setContent(htmlSource, { waitUntil: 'networkidle0' });

            const element = await page.$('#cert-container');
            let imageBuffer;
            if (element) {
                imageBuffer = await element.screenshot({ type: 'jpeg', quality: 95 });
            } else {
                imageBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });
            }

            // Prepare filename
            const safeName = user.name.replace(/\s+/g, '_');
            const fileName = `${safeName}_dnd2.0.jpg`;

            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('x-participant-name', user.name);
            res.setHeader('x-certificate-id', certificateId);
            res.setHeader('Content-Length', imageBuffer.length);
            
            return res.end(imageBuffer);

        } finally {
            if (browser) await browser.close();
        }

    } catch (error) {
        console.error('Error in /generate:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
