require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: 'libsql://hrms-db-parasharvaidehi2.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

module.exports = db;
