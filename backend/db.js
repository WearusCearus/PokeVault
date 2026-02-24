const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Could not connect to database:', err.message);
  } else {
    console.log('Connected to Supabase!');
    release();
  }
});

module.exports = pool;