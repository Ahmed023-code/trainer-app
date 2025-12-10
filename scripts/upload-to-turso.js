#!/usr/bin/env node
/**
 * Upload SQLite database to Turso
 * Reads your local database and uploads it row by row to Turso
 */

const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

// Your local database - using core database
const LOCAL_DB = path.join(__dirname, '../public/db/usda-core.sqlite');

// Turso connection (you'll need to set these as environment variables)
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing Turso credentials!');
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables');
  console.error('\nGet these from:');
  console.error('Vercel → Your Project → Settings → Environment Variables');
  process.exit(1);
}

async function uploadDatabase() {
  console.log('🚀 Starting database upload to Turso...\n');

  // Open local database
  const localDb = new Database(LOCAL_DB, { readonly: true });

  // Connect to Turso
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  try {
    // Get schema from local database
    console.log('📋 Reading local database schema...');
    const schema = localDb.prepare(`
      SELECT sql FROM sqlite_master
      WHERE type IN ('table', 'index')
      AND name NOT LIKE 'sqlite_%'
      ORDER BY type DESC
    `).all();

    // Create tables and indexes in Turso
    console.log('🏗️  Creating tables in Turso...');
    for (const { sql } of schema) {
      if (sql) {
        try {
          await turso.execute(sql);
        } catch (err) {
          // Table might already exist, that's okay
          if (!err.message.includes('already exists')) {
            console.error(`Warning: ${err.message}`);
          }
        }
      }
    }

    // Upload tables in dependency order (parent tables first)
    const tableOrder = ['nutrients', 'foods', 'branded_foods', 'food_nutrients', 'food_portions'];

    // Upload data for each table
    for (const tableName of tableOrder) {
      console.log(`\n📦 Uploading ${tableName}...`);

      const count = localDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   Total rows: ${count.count.toLocaleString()}`);

      // Get column names
      const columns = localDb.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnNames = columns.map(c => c.name);
      const placeholders = columnNames.map(() => '?').join(', ');

      // Read all rows
      const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();

      // Upload in batches
      const BATCH_SIZE = 100;
      let uploaded = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        // Execute batch
        const statements = batch.map(row => ({
          sql: `INSERT OR REPLACE INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`,
          args: columnNames.map(col => row[col])
        }));

        await turso.batch(statements, 'write');

        uploaded += batch.length;
        process.stdout.write(`   Progress: ${uploaded.toLocaleString()} / ${count.count.toLocaleString()} rows (${Math.round(uploaded / count.count * 100)}%)\r`);
      }

      console.log(`\n   ✓ Completed ${tableName}`);
    }

    console.log('\n\n✅ Database upload complete!');
    console.log('\n📊 Verifying...');

    // Verify
    const foodCount = await turso.execute('SELECT COUNT(*) as count FROM foods');
    console.log(`   Foods in Turso: ${foodCount.rows[0].count.toLocaleString()}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    throw error;
  } finally {
    localDb.close();
    turso.close();
  }
}

uploadDatabase().catch(console.error);
