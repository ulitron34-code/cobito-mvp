const pgPromise = require('pg-promise');
const { DATABASE_URL } = require('./env');

if (!DATABASE_URL) {
  console.warn('DATABASE_URL is not set. API routes that touch the database will fail until configured.');
}

const pgp = pgPromise({ capSQL: true });
const db = pgp(DATABASE_URL || 'postgresql://localhost:5432/cobito');

module.exports = db;
