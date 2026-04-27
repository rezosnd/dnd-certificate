const express = require('express');
const router = express.Router();
const sql = require('../config/db');

const WINNER_TEAMS = require('../config/winners');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find user by certificateId
        const users = await sql`SELECT * FROM users WHERE "certificateId" = ${id}`;

        if (users.length === 0 || !users[0].certificateGenerated) {
            return res.status(200).json({ valid: false });
        }

        const user = users[0];
        const winnerInfo = WINNER_TEAMS[user.email.toLowerCase()];

        return res.status(200).json({
            valid: true,
            name: user.name,
            certificateId: user.certificateId,
            event: "Decode & Dominate 2.0",
            isWinner: !!winnerInfo,
            teamName: winnerInfo ? winnerInfo.team : null,
            rank: winnerInfo ? winnerInfo.rankText : null
        });

    } catch (error) {
        console.error('Error verifying certificate:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
