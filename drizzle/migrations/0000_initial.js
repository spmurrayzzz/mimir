/**
 * Initial database migration
 */
const { sqliteTable, text, integer, blob } = require('drizzle-orm/sqlite-core');

module.exports = {
  up: async (db) => {
    // Create apps table
    await db.run(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create chats table
    await db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
      );
    `);

    // Create index for chats table
    await db.run(`
      CREATE INDEX IF NOT EXISTS chat_app_idx ON chats (app_id);
    `);

    // Create messages table
    await db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        code_actions TEXT,
        token_usage TEXT,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for messages table
    await db.run(`
      CREATE INDEX IF NOT EXISTS message_chat_idx ON messages (chat_id);
    `);
    await db.run(`
      CREATE INDEX IF NOT EXISTS message_timestamp_idx ON messages (timestamp);
    `);

    // Create language_model_providers table
    await db.run(`
      CREATE TABLE IF NOT EXISTS language_model_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        api_endpoint TEXT NOT NULL,
        api_key_encrypted BLOB,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
    `);

    // Create language_models table
    await db.run(`
      CREATE TABLE IF NOT EXISTS language_models (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        max_tokens INTEGER,
        cost_per_token TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (provider_id) REFERENCES language_model_providers (id) ON DELETE CASCADE
      );
    `);

    // Create index for language_models table
    await db.run(`
      CREATE INDEX IF NOT EXISTS model_provider_idx ON language_models (provider_id);
    `);

    // Create settings table
    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  },

  down: async (db) => {
    // Drop tables in reverse order
    await db.run(`DROP TABLE IF EXISTS settings;`);
    await db.run(`DROP TABLE IF EXISTS language_models;`);
    await db.run(`DROP TABLE IF EXISTS language_model_providers;`);
    await db.run(`DROP TABLE IF EXISTS messages;`);
    await db.run(`DROP TABLE IF EXISTS chats;`);
    await db.run(`DROP TABLE IF EXISTS apps;`);

    // Drop indexes (SQLite automatically drops indexes when the table is dropped)
  }
};