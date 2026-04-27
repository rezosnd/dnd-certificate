require('dotenv').config();
const sql = require('./config/db');

const winners = [
    // 1st Place: Data pirates
    { name: 'Shrey Pandey', email: '2405904@kiit.ac.in' },
    { name: 'Aditya Kumar Gupta', email: '24052178@kiit.ac.in' },
    { name: 'Krishna Prasad', email: '24052690@kiit.ac.in' },
    { name: 'Shourya Kumar', email: '24052088@kiit.ac.in' },

    // 2nd Place: Raftaar
    { name: 'Swastik Bandyopadhyay', email: '24052040@kiit.ac.in' },
    { name: 'Anaranya Ghosh', email: '2404010@kiit.ac.in' },
    { name: 'Divyanshu Sarma', email: '25155365@kiit.ac.in' },

    // Top 5: Decode Dudes
    { name: 'Adarsh Vishwaraj', email: '2328004@kiit.ac.in' },
    { name: 'Ravish Singh', email: '2328111@kiit.ac.in' },
    { name: 'Aniket Kumar', email: '2328152@kiit.ac.in' },

    // Top 5: Team Forge
    { name: 'Khushal Behura', email: '2505731@kiit.ac.in' },
    { name: 'Rohit Raj', email: '25155378@kiit.ac.in' },
    { name: 'Gourav Kar', email: '25155257@kiit.ac.in' },
    { name: 'Suyash Raj Shekhar', email: '25155758@kiit.ac.in' },

    // Top 5: Astrophile
    { name: 'Abhyuday Raj', email: '241551018@kiit.ac.in' },
    { name: 'Anushka Anand Raipure', email: '2505390@kiit.ac.in' },
    { name: 'Aditi Yadav', email: '2506002@kiit.ac.in' },
    { name: 'Rehan Suman', email: 'rehansuman41008@gmail.com' }
];

async function addWinners() {
    console.log('🔗 Connecting to DB...');
    let added = 0;

    for (const winner of winners) {
        try {
            await sql`
                INSERT INTO users (name, email)
                VALUES (${winner.name}, ${winner.email.toLowerCase().trim()})
                ON CONFLICT (email)
                DO UPDATE SET name = EXCLUDED.name
            `;
            added++;
            console.log(`✅ Added/Updated: ${winner.name} (${winner.email})`);
        } catch (err) {
            console.error(`❌ Error adding ${winner.name}:`, err.message);
        }
    }

    console.log(`\n🎉 Successfully processed ${added} winners!`);
    process.exit();
}

addWinners();
