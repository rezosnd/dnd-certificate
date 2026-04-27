const express = require('express');
const router = express.Router();
const sql = require('../config/db');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const getBase64 = (fileName) => {
    try {
        const filePath = path.join(__dirname, '..', '..', 'frontend', 'public', fileName);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).substring(1);
            const content = fs.readFileSync(filePath);
            return `data:image/${ext === 'avif' ? 'avif' : ext};base64,${content.toString('base64')}`;
        }
        return '';
    } catch (e) {
        return '';
    }
};

// --- WINNER TEAMS DATA ---
const WINNER_TEAMS = require('../config/winners');
// -------------------------
// -------------------------

router.get('/', async (req, res) => {
    handleGenerate(req, res);
});

router.post('/', async (req, res) => {
    handleGenerate(req, res);
});

async function handleGenerate(req, res) {
    try {
        const email = (req.body?.email || req.query?.email || '').toLowerCase().trim();

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            return res.status(404).json({ message: 'No record found ❌' });
        }

        const user = users[0];
        // Handle both camelCase and lowercase from standard Postgres drivers
        let certificateId = user.certificateId || user.certificateid;
        let certificateGenerated = user.certificateGenerated || user.certificategenerated;

        // --- INSTANT CACHE LOGIC ---
        const cacheDir = path.join(__dirname, '..', 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const emailHash = crypto.createHash('md5').update(email).digest('hex');
        const winnerInfo = WINNER_TEAMS[email];
        // If they are a winner, we use a unique cache name to force regeneration if needed
        const cacheFileName = winnerInfo ? `${emailHash}_winner.jpg` : `${emailHash}.jpg`;
        const cachePath = path.join(cacheDir, cacheFileName);
        
        // If image exists in cache, serve it instantly with proper headers
        if (fs.existsSync(cachePath)) {
            console.log(`🚀 Serving cached certificate for: ${email}`);
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('x-participant-name', user.name);
            res.setHeader('x-certificate-id', certificateId || 'VALID');
            if (winnerInfo) {
                res.setHeader('x-is-winner', 'true');
                res.setHeader('x-team-name', winnerInfo.team);
                res.setHeader('x-rank', winnerInfo.rankText);
            }
            res.setHeader('Content-Disposition', `attachment; filename="${user.name.replace(/\s+/g, '_')}_dnd2.0.jpg"`);
            return res.sendFile(cachePath);
        }
        // ---------------------------

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

        // Prepare Local Assets as Base64 for Certificate
        const mascotBase64 = getBase64('mascot.png');
        const kiitLogoBase64 = getBase64('kiit-cse_logo.webp');
        const kfLogoBase64 = getBase64('kiitfestwatermark.avif');
        const signBase64 = getBase64('roshni maam.avif');

        // Ultra-Robust URL Sanitization: Strip any variation of protocol typos (like https//: or https:/) and force one clean https://
        const rawFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
        const cleanFrontend = `https://${rawFrontend.replace(/^(https?[:/]+)+/i, '').replace(/\/+$/, '')}`;
        const verifyLink = `${cleanFrontend}/verify/${certificateId}`; 
        
        const qrDataUrl = await QRCode.toDataURL(verifyLink, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        });

        // Pre-generate binary data for the overlay
        let binData = "";
        for(let i=0; i<3000; i++) {
            binData += (Math.random() > 0.5 ? "0 " : "1 ") + (Math.random() > 0.8 ? "01 " : "");
        }

        // --- TEMPLATE SELECTION ---
        let htmlSource = "";

        if (winnerInfo) {
            // WINNER / EXCELLENCE TEMPLATE
            htmlSource = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&family=Fira+Code:wght@700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --kiit-red: #ff2e63;
                        --deep-navy: #0b1120;
                        --sky-tint: #f1f8ff;
                        --gold: linear-gradient(45deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
                        --silver: linear-gradient(45deg, #9da1a4, #e2e4e5, #b1b4b6, #d1d3d4);
                        --bronze: linear-gradient(45deg, #804a00, #b08d57, #804a00, #ddc05e, #804a00);
                    }
                    body { margin: 0; padding: 0; background: #fff; font-family: 'Montserrat', sans-serif; }
                    #cert-container {
                        width: 1122px; height: 793px;
                        background: var(--sky-tint);
                        position: relative;
                        display: flex;
                        overflow: hidden;
                        box-sizing: border-box;
                        border: 6px solid var(--deep-navy);
                    }
                    .border-winner { border-color: #bf953f !important; }
                    .binary-overlay {
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 100%;
                        font-family: 'Fira Code', monospace;
                        font-size: 9px;
                        color: rgba(11, 17, 32, 0.04);
                        line-height: 1.3;
                        z-index: 1;
                        padding: 15px;
                        word-break: break-all;
                        pointer-events: none;
                    }
                    .sidebar-strip {
                        width: 90px; height: 100%;
                        background: var(--deep-navy);
                        position: absolute; right: 0;
                        z-index: 20;
                        display: flex; align-items: center; justify-content: center;
                        border-left: 6px solid var(--kiit-red);
                    }
                    .sidebar-text {
                        writing-mode: vertical-rl;
                        color: #fff;
                        font-family: 'Orbitron';
                        font-size: 30px;
                        letter-spacing: 18px;
                        font-weight: 900;
                        text-transform: uppercase;
                        opacity: 0.25;
                        white-space: nowrap;
                        transform: rotate(180deg);
                    }
                    .main-canvas {
                        flex-grow: 1;
                        padding: 30px 140px 30px 70px;
                        z-index: 10;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                    }
                    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .rank-badge {
                        font-family: 'Orbitron';
                        padding: 8px 25px;
                        font-weight: 900;
                        font-size: 18px;
                        letter-spacing: 2px;
                        color: #000;
                        clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
                        margin-bottom: 10px;
                    }
                    .bg-gold { background: var(--gold); }
                    .bg-silver { background: var(--silver); }
                    .bg-bronze { background: var(--bronze); }
                    .text-center { text-align: center; flex-grow: 1; }
                    h1 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 64px;
                        font-weight: 900;
                        color: var(--deep-navy);
                        margin: 0;
                        letter-spacing: 10px;
                    }
                    h2 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 22px;
                        letter-spacing: 8px;
                        color: var(--kiit-red);
                        margin: 5px 0 15px 0;
                    }
                    .team-container { margin: 15px 0; }
                    .team-name { font-family: 'Orbitron'; font-size: 24px; color: var(--kiit-red); font-weight: 800; text-transform: uppercase; }
                    .recipient-name {
                        font-family: 'Playfair Display', serif;
                        font-size: 48px;
                        color: #000;
                        margin: 5px 0;
                        display: inline-block;
                        border-bottom: 4px double var(--kiit-red);
                        padding: 0 50px 5px 50px;
                    }
                    .event-desc {
                        font-size: 16px;
                        line-height: 1.6;
                        color: #222;
                        max-width: 85%;
                        margin: 10px auto;
                        font-weight: 500;
                    }
                    footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
                    .sig-block { text-align: center; width: 240px; }
                    .sig-img { height: 90px; margin-bottom: -15px; position: relative; z-index: 5; }
                    .sig-line { width: 100%; height: 2px; background: #000; margin-bottom: 8px; }
                    .sig-label { font-family: 'Orbitron'; font-size: 11px; font-weight: 800; letter-spacing: 2px; }
                    .qr-block { text-align: center; z-index: 50; }
                    .qr-frame { border: 3px solid #000; padding: 5px; background: #fff; display: inline-block; margin-bottom: 5px; }
                    .uid-tag { background: #000; color: #fff !important; font-family: 'Fira Code', monospace; font-size: 10px; padding: 4px 12px; border-radius: 2px; display: block; }
                    .watermark-main { position: absolute; top: 55%; left: 45%; transform: translate(-50%, -50%); width: 450px; opacity: 0.12; z-index: 2; pointer-events: none; }
                </style>
            </head>
            <body>
                <div id="cert-container" class="border-winner">
                    <div class="binary-overlay">${binData}</div>
                    <img src="${mascotBase64}" class="watermark-main">
                    <div class="sidebar-strip">
                        <div class="sidebar-text">DECODE & DOMINATE 2.0</div>
                    </div>
                    <div class="main-canvas">
                        <header>
                            <img src="${kiitLogoBase64}" style="height: 60px;">
                            <div class="rank-badge ${winnerInfo.badgeClass}">${winnerInfo.rank}</div>
                            <img src="${kfLogoBase64}" style="height: 50px;">
                        </header>
                        <div class="text-center">
                            <h1>CERTIFICATE</h1>
                            <h2>OF EXCELLENCE</h2>
                            <p style="font-size: 16px; color: #444; margin-top: 10px; font-weight: 600;">Awarded to the members of</p>
                            <div class="team-container">
                                <div class="team-name">TEAM ${winnerInfo.team}</div>
                                <div class="recipient-name">${user.name}</div>
                            </div>
                            <p class="event-desc">
                                for securing <b>${winnerInfo.rankText}</b> in <b>“Decode & Dominate 2.0”</b>, the flagship technical event of <b>KIIT Fest 9.0</b>. Their innovative solution and exceptional technical execution distinguished them as the top performers of this competition.
                            </p>
                        </div>
                        <footer>
                            <div class="sig-block">
                                <img src="${signBase64}" class="sig-img">
                                <div class="sig-line"></div>
                                <p class="sig-label">CHAIRPERSON | KIIT FEST 9.0</p>
                                <p style="font-size: 11px; font-weight: 800; margin: 2px 0;">Dr. ROSHNI PRADHAN</p>
                                <p style="font-size: 12px; color: var(--kiit-red); margin-top: 5px; font-weight: 900;">07.03.2026</p>
                            </div>
                            <div class="qr-block">
                                <div class="qr-frame">
                                    <img src="${qrDataUrl}" style="width: 90px;">
                                </div>
                                <div class="uid-tag">UID: ${certificateId}</div>
                            </div>
                        </footer>
                    </div>
                </div>
            </body>
            </html>`;
        } else {
            // STANDARD PARTICIPATION TEMPLATE
            htmlSource = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&family=Fira+Code:wght@700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --kiit-red: #ff2e63;
                        --deep-navy: #0b1120;
                        --sky-tint: #f1f8ff;
                    }
                    body { margin: 0; padding: 0; background: #fff; font-family: 'Montserrat', sans-serif; }
                    #cert-container {
                        width: 1122px; height: 793px;
                        background: var(--sky-tint);
                        position: relative;
                        display: flex;
                        overflow: hidden;
                        box-sizing: border-box;
                        border: 2px solid #000;
                    }
                    .binary-overlay {
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 100%;
                        font-family: 'Fira Code', monospace;
                        font-size: 9px;
                        color: rgba(11, 17, 32, 0.04);
                        line-height: 1.3;
                        overflow: hidden;
                        z-index: 1;
                        padding: 15px;
                        word-break: break-all;
                        pointer-events: none;
                    }
                    .sidebar-strip {
                        width: 90px; height: 100%;
                        background: var(--deep-navy);
                        position: absolute; right: 0;
                        z-index: 20;
                        display: flex; align-items: center; justify-content: center;
                        border-left: 6px solid var(--kiit-red);
                    }
                    .sidebar-text {
                        writing-mode: vertical-rl;
                        color: #fff;
                        font-family: 'Orbitron';
                        font-size: 30px;
                        letter-spacing: 18px;
                        font-weight: 900;
                        text-transform: uppercase;
                        opacity: 0.25;
                        white-space: nowrap;
                        transform: rotate(180deg);
                    }
                    .main-canvas {
                        flex-grow: 1;
                        padding: 30px 140px 30px 70px;
                        z-index: 10;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                    }
                    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .logo-left { height: 65px; }
                    .logo-right { height: 55px; }
                    .text-center { text-align: center; flex-grow: 1; }
                    h1 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 68px;
                        font-weight: 900;
                        color: var(--deep-navy);
                        margin: 0;
                        letter-spacing: 12px;
                    }
                    h2 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 22px;
                        letter-spacing: 10px;
                        color: var(--kiit-red);
                        margin: 5px 0 25px 0;
                    }
                    .recipient-name {
                        font-family: 'Playfair Display', serif;
                        font-size: 52px;
                        color: #000;
                        margin: 10px 0;
                        display: inline-block;
                        border-bottom: 4px double var(--kiit-red);
                        padding: 0 50px 5px 50px;
                    }
                    .event-desc {
                        font-size: 17px;
                        line-height: 1.7;
                        color: #222;
                        max-width: 85%;
                        margin: 15px auto;
                        font-weight: 500;
                    }
                    .appreciation-block {
                        margin: 15px auto;
                        padding-top: 15px;
                        border-top: 2px solid rgba(255, 46, 99, 0.2);
                        width: 80%;
                    }
                    .appreciation-text {
                        font-size: 16px;
                        font-style: italic;
                        color: #000;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                    }
                    footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
                    .sig-block { text-align: center; width: 240px; }
                    .sig-img { height: 100px; margin-bottom: -15px; position: relative; z-index: 5; }
                    .sig-line { width: 100%; height: 2px; background: #000; margin-bottom: 8px; position: relative; z-index: 1; }
                    .sig-label { font-family: 'Orbitron'; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin: 2px 0; }
                    .qr-block { text-align: center; z-index: 50; background: rgba(241, 248, 255, 0.95); padding: 8px; border-radius: 4px; }
                    .qr-frame { width: 120px; height: 120px; border: 4px solid #000; background: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
                    .uid-tag { background: #000; color: #fff !important; font-family: 'Fira Code', monospace; font-size: 10px; font-weight: 800; padding: 4px 12px; display: block; letter-spacing: 1px; border-radius: 2px; }
                    .watermark-main { position: absolute; top: 55%; left: 45%; transform: translate(-50%, -50%); width: 450px; opacity: 0.12; z-index: 2; pointer-events: none; }
                </style>
            </head>
            <body>
                <div id="cert-container">
                    <div class="binary-overlay">${binData}</div>
                    <img src="${mascotBase64}" class="watermark-main">
                    <div class="sidebar-strip">
                        <div class="sidebar-text">DECODE & DOMINATE 2.0</div>
                    </div>
                    <div class="main-canvas">
                        <header>
                            <img src="${kiitLogoBase64}" class="logo-left" alt="KIIT CSE">
                            <img src="${kfLogoBase64}" class="logo-right" alt="KIIT Fest">
                        </header>
                        <div class="text-center">
                            <h1>CERTIFICATE</h1>
                            <h2>OF PARTICIPATION</h2>
                            <p style="font-size: 17px; color: #444; margin-top: 20px; font-weight: 600;">This is to proudly certify the excellence of</p>
                            <div class="recipient-name">${user.name}</div>
                            <p class="event-desc">
                                for participating in <b>“Decode & Dominate 2.0”</b>, the flagship technical event of <b>KIIT Fest 9.0</b>, conducted from <b>March 6th–7th, 2026</b>. The participant showcased outstanding technical proficiency and innovative problem-solving skills throughout the event.
                            </p>
                            <div class="appreciation-block">
                                <div class="appreciation-text">
                                    We applaud their efforts and extend our best wishes for their future endeavors.
                                </div>
                            </div>
                        </div>
                        <footer>
                            <div class="sig-block">
                                <img src="${signBase64}" class="sig-img">
                                <div class="sig-line"></div>
                                <p class="sig-label">CHAIRPERSON | KIIT FEST 9.0</p>
                                <p style="font-size: 11px; font-weight: 800; margin: 2px 0;">Dr. ROSHNI PRADHAN</p>
                                <p style="font-size: 12px; color: var(--kiit-red); margin-top: 5px; font-weight: 900;">DATED: 07.03.2026</p>
                            </div>
                            <div class="qr-block">
                                <div class="qr-frame">
                                    <img src="${qrDataUrl}" style="width: 110px;">
                                </div>
                                <div class="uid-tag">UID: ${certificateId}</div>
                            </div>
                        </footer>
                    </div>
                </div>
            </body>
            </html>`;
        }

        // Launch Puppeteer to capture as JPEG
        let browser;
        try {
            const launchOptions = {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            };
            if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            }
            browser = await puppeteer.launch(launchOptions);
            const page = await browser.newPage();
            
            await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
            
            // Use 'load' instead of 'networkidle0' for much faster and more reliable performance
            await page.setContent(htmlSource, { 
                waitUntil: 'load',
                timeout: 60000 
            });

            // Wait for fonts to be ready specifically
            await page.evaluateHandle('document.fonts.ready');

            const element = await page.$('#cert-container');
            let imageBuffer;
            if (element) {
                imageBuffer = await element.screenshot({ type: 'jpeg', quality: 95 });
            } else {
                imageBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });
            }
            
            // SAVE TO CACHE for instant social preview next time (Resilient)
            try {
                const cacheDir = path.dirname(cachePath);
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }
                fs.writeFileSync(cachePath, imageBuffer);
                console.log(`✅ Cached certificate for: ${email}`);
            } catch (cacheErr) {
                console.warn('⚠️ Cache writing failed (silently skipping):', cacheErr.message);
            }

            // Prepare filename
            const safeName = user.name.replace(/\s+/g, '_');
            const fileName = `${safeName}_dnd2.0.jpg`;

            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('x-participant-name', user.name);
            res.setHeader('x-certificate-id', certificateId);
            if (winnerInfo) {
                res.setHeader('x-is-winner', 'true');
                res.setHeader('x-team-name', winnerInfo.team);
                res.setHeader('x-rank', winnerInfo.rankText);
            }
            res.setHeader('Content-Length', imageBuffer.length);
            
            return res.end(imageBuffer);

        } finally {
            if (browser) await browser.close();
        }

    } catch (error) {
        console.error('CRITICAL ERROR IN /GENERATE:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

module.exports = router;
