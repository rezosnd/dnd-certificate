require('dotenv').config();
const sql = require('./config/db');
const fs = require('fs');

const csvFilePath = '..\\Copy of DECODE AND DOMINATE FINALE.csv';

async function importData() {
    console.log('✅ Connected to DB');
    
    // Read and parse CSV
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const rows = csvData.split('\n');
    let imported = 0;
    
    // Start from index 1 to skip header
    for (let i = 1; i < rows.length; i++) {
        const rowString = rows[i].trim();
        if (!rowString) continue;
        
        // rudimentary CSV parser just using split, since there are no quoted commas in the provided data
        const cols = rowString.split(',');
        if (cols.length >= 3) {
            const rawEmail1 = cols[0].trim();
            const rawName = cols[1].trim();
            const rawEmail2 = cols[2].trim().replace(/\s/g, ''); // Fix spaces in emails like "rehan suman41008"
            
            // Prefer KIITFEST registered mail id (3rd column)
            const targetEmail = rawEmail2 || rawEmail1;
            
            if (rawName && targetEmail) {
                // Upsert user into database to avoid duplications
                await sql`
                    INSERT INTO users (name, email)
                    VALUES (${rawName}, ${targetEmail})
                    ON CONFLICT (email)
                    DO UPDATE SET name = EXCLUDED.name
                `;
                imported++;
            }
        }
    }
    
    console.log(`🎉 Successfully imported ${imported} participants into the database!`);
    
    process.exit();
}

importData().catch(err => {
    console.error('❌ Database Connection Error:', err);
    process.exit(1);
});
