const express = require('express');
const router = express.Router();
const sql = require('../config/db');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
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

        // Embedded High-Fidelity Certificate Template
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; background-color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                #cert-container {
                    width: 1122px; height: 793px; position: relative;
                    background: #fff; overflow: hidden; padding: 40px; box-sizing: border-box;
                    border: 20px solid #f8f9fa;
                }
                .watermark {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-10deg);
                    height: 70%; opacity: 0.08; z-index: 1; pointer-events: none;
                }
                .content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; border: 2px solid #eee; padding: 20px; }
                .header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header img { height: 70px; object-fit: contain; }
                .title { font-size: 54px; font-weight: 800; color: #111; margin: 20px 0 10px 0; letter-spacing: 2px; }
                .subtitle { font-size: 24px; color: #444; margin-bottom: 40px; font-style: italic; }
                .participant-name { font-size: 48px; font-weight: 700; color: #000; border-bottom: 3px solid #000; padding: 0 40px 5px 40px; margin-bottom: 20px; text-transform: uppercase; }
                .event-details { font-size: 18px; color: #555; line-height: 1.6; max-width: 800px; margin-bottom: 40px; }
                .footer { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding: 0 40px 20px 40px; }
                .sign-box { text-align: center; }
                .sign-box img { height: 60px; margin-bottom: 5px; }
                .sign-box p { font-size: 14px; font-weight: 700; color: #333; margin: 0; text-transform: uppercase; }
                .qr-box { text-align: center; }
                .cert-id { font-family: monospace; font-size: 12px; color: #888; margin-top: 5px; border: 1px solid #eee; padding: 2px 8px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div id="cert-container">
                <img src="https://i.ibb.co/S4zFW4z5/file-000000003de07208a2b5c3d4ebf1a0b9.png" class="watermark" alt="watermark">
                <div class="content">
                    <div class="header">
                        <img src="https://i.ibb.co/tpTfk98g/kiit-cse-logo.webp" alt="KIIT Logo">
                        <img src="https://i.ibb.co/60YDZH3P/kiitfest-wordmark.avif" alt="KIITFEST Logo">
                    </div>
                    <div class="title">CERTIFICATE</div>
                    <div class="subtitle">of Participation</div>
                    <p style="font-size: 18px; color: #666; margin: 0;">This is to certify that</p>
                    <div class="participant-name">${user.name}</div>
                    <div class="event-details">
                        Successfully participated in <strong>DECODE & DOMINATE 2.0</strong>, a flagship tech challenge organized as part of <strong>KIIT FEST 2026</strong> by the School of Computer Engineering, KIIT University.
                    </div>
                    <div class="footer">
                        <div class="sign-box">
                            <img src="https://i.ibb.co/35M5JC2y/AD-Eng-Signature.jpg" alt="Signature">
                            <p>Authorized Signature</p>
                        </div>
                        <div class="qr-box">
                            <img src="${qrDataUrl}" style="width: 110px;">
                            <div class="cert-id">${certificateId}</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        let htmlSource = htmlTemplate;

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
        console.error('CRITICAL ERROR IN /GENERATE:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;
