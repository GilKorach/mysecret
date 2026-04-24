const mysql = require('mysql2/promise');
const { env } = require('../config');

async function main() {
  if (env.db.database !== 'MySecret') {
    throw new Error('Refusing to create any schema except MySecret.');
  }

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    charset: 'utf8mb4',
    multipleStatements: false
  });

  try {
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS `MySecret` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    console.log('Database MySecret exists or was created.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
