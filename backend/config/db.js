const { neon } = require('@neondatabase/serverless');

// We grab the database string from .env
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
