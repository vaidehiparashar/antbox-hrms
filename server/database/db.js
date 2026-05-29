require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');

const TURSO_URL = 'libsql://hrms-db-parasharvaidehi2.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzk5ODQyMzMsImlkIjoiMDE5ZTZmNTItYWUwMS03NDg1LWI5ZDctMzdhMzdmMzJlZjljIiwicmlkIjoiMjBhMTIyNTctMzA5NC00NTlhLTg0NDAtOGZjZmJkZmI4MTQ5In0.KrF9n7Mlq8xBksHupdBVuacG1BuaKVLTG8SKtAdzN1uWUikm2nSeGXRF-Rw6-lr1xqenLYmhhY_qpG2_p3WUAA';

// Locally (no RAILWAY_ENVIRONMENT set), use local SQLite for speed + reliability
const isLocal = !process.env.RAILWAY_ENVIRONMENT && process.env.NODE_ENV !== 'production';

const db = createClient(
  isLocal
    ? { url: `file:${path.resolve(__dirname, 'hrms.db')}` }
    : { url: TURSO_URL, authToken: TURSO_TOKEN }
);

module.exports = db;
