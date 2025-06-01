/**
 * Drizzle ORM configuration
 */
const path = require('path');
const { defineConfig } = require('drizzle-kit');

// For Electron production, we don't know the user data path at build time
// This is just for migration generation - runtime uses the actual user data path
const dbFilePath = path.join(process.cwd(), 'mimir.sqlite');

module.exports = defineConfig({
  schema: './src/db/schema.js',
  driver: 'sqlite',
  dbCredentials: {
    url: dbFilePath
  },
  out: './drizzle',
  verbose: true,
  strict: true
});