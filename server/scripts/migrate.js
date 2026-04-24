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
    await connection.query('USE `MySecret`;');
    await connection.query(sql);

    await connection.query(`
      UPDATE comments
      SET content = LEFT(content, 500)
      WHERE CHAR_LENGTH(content) > 500
    `);

    await connection.query(`
      ALTER TABLE comments
      MODIFY content VARCHAR(500) NOT NULL
    `);

    await connection.query(`
      CREATE INDEX idx_secrets_feed_visibility ON secrets (is_deleted, user_id, created_at)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_secrets_feed_recent ON secrets (is_deleted, created_at, id)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_secrets_slug ON secrets (id, slug)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_comments_secret_tree_created ON comments (secret_id, parent_id, is_deleted, created_at)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_comment_reactions_comment_created ON comment_reactions (comment_id, created_at)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_followers_follower_created ON followers (follower_id, created_at)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_blocked_users_blocker_created ON blocked_users (blocker_id, created_at)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_notifications_secret_id ON notifications (secret_id)
    `).catch(ignoreDuplicateIndex);
    await connection.query(`
      CREATE INDEX idx_notifications_comment_id ON notifications (comment_id)
    `).catch(ignoreDuplicateIndex);

    console.log('Migration completed for existing schema MySecret.');
  } finally {
    await connection.end();
  }
}

function ignoreDuplicateIndex(error) {
  if (!['ER_DUP_KEYNAME', 'ER_MULTIPLE_PRI_KEY', 'ER_FK_DUP_NAME'].includes(error.code)) {
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
