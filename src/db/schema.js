/**
 * Database schema definitions using Drizzle ORM
 */
const { sqliteTable, text, integer, blob, index } = require('drizzle-orm/sqlite-core');

/**
 * Apps table
 * Stores application metadata
 */
const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  description: text('description'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull()
});

/**
 * Chats table
 * Stores chat session metadata associated with an app
 */
const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  app_id: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull()
}, (table) => {
  return {
    app_idx: index('chat_app_idx').on(table.app_id)
  };
});

/**
 * Messages table
 * Stores individual chat messages
 */
const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chat_id: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  code_actions: text('code_actions', { mode: 'json' }),
  token_usage: text('token_usage', { mode: 'json' })
}, (table) => {
  return {
    chat_idx: index('message_chat_idx').on(table.chat_id),
    timestamp_idx: index('message_timestamp_idx').on(table.timestamp)
  };
});

/**
 * Language Model Providers table
 * Stores configuration for different LLM providers
 */
const language_model_providers = sqliteTable('language_model_providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  api_endpoint: text('api_endpoint').notNull(),
  api_key_encrypted: blob('api_key_encrypted'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull()
});

/**
 * Language Models table
 * Stores configuration for specific models from providers
 */
const language_models = sqliteTable('language_models', {
  id: text('id').primaryKey(),
  provider_id: text('provider_id').notNull().references(() => language_model_providers.id, { onDelete: 'cascade' }),
  model_name: text('model_name').notNull(),
  display_name: text('display_name').notNull(),
  max_tokens: integer('max_tokens'),
  cost_per_token: text('cost_per_token'), // Stored as string to handle decimal precision
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true)
}, (table) => {
  return {
    provider_idx: index('model_provider_idx').on(table.provider_id)
  };
});

/**
 * Settings table
 * Stores application settings
 */
const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull()
});

module.exports = {
  apps,
  chats,
  messages,
  language_model_providers,
  language_models,
  settings
};