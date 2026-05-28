const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Create LibSQL client connecting to Turso (or local SQLite if not provided)
const db = createClient({
  url: process.env.TURSO_URL || 'file:hrms.db',
  authToken: process.env.TURSO_TOKEN
});

// We can still optionally run schema locally if using local db
if (!process.env.TURSO_URL) {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // Using executeMultiple for schema execution if needed
    // db.executeMultiple(schema).catch(console.error);
  }
}

module.exports = db;
