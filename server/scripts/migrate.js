const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const { env, validateConfig } = require('../config');

async function main() {
  validateConfig();
  const sql = await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  const connection = await mysql.createConnection({
    ...env.db,
    multipleStatements: true,
    charset: 'utf8mb4'
  });
  try {
    await connection.query(sql);
    console.log('Migration completed for existing schema MySecret.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
