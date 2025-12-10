#!/usr/bin/env node
/**
 * Verify Postgres database contents
 */

const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ Missing POSTGRES_URL environment variable');
  process.exit(1);
}

async function verifyDatabase() {
  console.log('🔍 Verifying Neon Postgres database...\n');

  const client = new Client({
    connectionString: POSTGRES_URL,
  });

  await client.connect();

  try {
    // Check tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Tables found:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    // Count rows in each table
    const tableNames = ['nutrients', 'foods', 'branded_foods', 'food_nutrients', 'food_portions'];

    for (const tableName of tableNames) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        console.log(`📊 ${tableName}: ${count.toLocaleString()} rows`);
      } catch (err) {
        console.log(`⚠️  ${tableName}: Table not found or error - ${err.message}`);
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

verifyDatabase().catch(console.error);
