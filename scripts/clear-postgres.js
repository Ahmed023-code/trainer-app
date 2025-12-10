#!/usr/bin/env node
/**
 * Clear all data from Postgres database before uploading new data
 */

const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ Missing POSTGRES_URL environment variable');
  process.exit(1);
}

async function clearDatabase() {
  console.log('🗑️  Clearing Neon Postgres database...\n');

  const client = new Client({
    connectionString: POSTGRES_URL,
  });

  await client.connect();

  try {
    // Drop all tables (in reverse dependency order)
    console.log('Dropping tables...');
    await client.query('DROP TABLE IF EXISTS food_portions CASCADE');
    await client.query('DROP TABLE IF EXISTS food_nutrients CASCADE');
    await client.query('DROP TABLE IF EXISTS branded_foods CASCADE');
    await client.query('DROP TABLE IF EXISTS foods CASCADE');
    await client.query('DROP TABLE IF EXISTS nutrients CASCADE');

    console.log('✅ Database cleared successfully!\n');

  } catch (error) {
    console.error('❌ Clear failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

clearDatabase().catch(console.error);
