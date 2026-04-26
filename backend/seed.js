require('dotenv').config();
const sql = require('./config/db');

async function seed() {
    try {
        console.log('🔗 Connecting to DB...');
        
        // 1. Drop existing table (Optional, but useful for pure seed overwrite)
        await sql`DROP TABLE IF EXISTS users CASCADE`;
        
        // 2. Create users table
        await sql`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                "certificateId" VARCHAR(255) UNIQUE,
                "certificateGenerated" BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Users table created');

        // 3. Clear existing data (if we hadn't dropped, but we did)
        // await sql`TRUNCATE TABLE users RESTART IDENTITY`;
        
        // 4. Insert dummy test user
        await sql`
            INSERT INTO users (name, email)
            VALUES ('John Doe', 'johndoe@kiit.ac.in')
        `;
        
        console.log('✅ Seeded test user: johndoe@kiit.ac.in');

    } catch (err) {
        console.error('❌ Seeding error:', err);
    } finally {
        process.exit();
    }
}

seed();
