#!/usr/bin/env node
/**
 * Upload SQLite database to Vercel Postgres (Neon)
 * Reads your local core database and uploads it to Postgres
 */

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

// Your local database - using full database with all 2M foods
const LOCAL_DB = path.join(__dirname, '../public/db/usda-full.sqlite');

// Postgres connection (from Vercel environment variables)
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ Missing Postgres credentials!');
  console.error('Set POSTGRES_URL environment variable');
  console.error('\nGet this from:');
  console.error('Vercel → Your Project → Storage → Postgres → .env.local tab');
  process.exit(1);
}

async function uploadDatabase() {
  console.log('🚀 Starting database upload to Vercel Postgres...\n');

  // Open local database
  const localDb = new Database(LOCAL_DB, { readonly: true });

  // Connect to Postgres
  const client = new Client({
    connectionString: POSTGRES_URL,
  });

  await client.connect();

  try {
    console.log('📋 Creating tables in Postgres...');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrients (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        unit_name TEXT,
        nutrient_nbr TEXT,
        rank REAL
      );

      CREATE TABLE IF NOT EXISTS foods (
        fdc_id INTEGER PRIMARY KEY,
        data_type TEXT NOT NULL,
        description TEXT NOT NULL,
        food_category_id TEXT,
        publication_date TEXT
      );

      CREATE TABLE IF NOT EXISTS branded_foods (
        fdc_id INTEGER PRIMARY KEY,
        brand_owner TEXT,
        brand_name TEXT,
        subbrand_name TEXT,
        gtin_upc TEXT,
        ingredients TEXT,
        serving_size REAL,
        serving_size_unit TEXT,
        household_serving_fulltext TEXT,
        branded_food_category TEXT,
        discontinued_date TEXT,
        FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id)
      );

      CREATE TABLE IF NOT EXISTS food_nutrients (
        id INTEGER PRIMARY KEY,
        fdc_id INTEGER NOT NULL,
        nutrient_id INTEGER NOT NULL,
        amount REAL,
        FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id),
        FOREIGN KEY (nutrient_id) REFERENCES nutrients(id)
      );

      CREATE TABLE IF NOT EXISTS food_portions (
        id INTEGER PRIMARY KEY,
        fdc_id INTEGER NOT NULL,
        seq_num INTEGER,
        amount REAL,
        measure_unit_id INTEGER,
        portion_description TEXT,
        modifier TEXT,
        gram_weight REAL,
        FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id)
      );
    `);

    console.log('📊 Creating indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_foods_data_type ON foods(data_type);
      CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description);
      CREATE INDEX IF NOT EXISTS idx_branded_gtin ON branded_foods(gtin_upc);
      CREATE INDEX IF NOT EXISTS idx_food_nutrients_fdc ON food_nutrients(fdc_id);
      CREATE INDEX IF NOT EXISTS idx_food_nutrients_nutrient ON food_nutrients(nutrient_id);
      CREATE INDEX IF NOT EXISTS idx_food_portions_fdc ON food_portions(fdc_id);
    `);

    // Upload tables in dependency order
    const tableOrder = [
      { name: 'nutrients', columns: ['id', 'name', 'unit_name', 'nutrient_nbr', 'rank'] },
      { name: 'foods', columns: ['fdc_id', 'data_type', 'description', 'food_category_id', 'publication_date'] },
      { name: 'branded_foods', columns: ['fdc_id', 'brand_owner', 'brand_name', 'subbrand_name', 'gtin_upc', 'ingredients', 'serving_size', 'serving_size_unit', 'household_serving_fulltext', 'branded_food_category', 'discontinued_date'] },
      { name: 'food_nutrients', columns: ['id', 'fdc_id', 'nutrient_id', 'amount'] },
      { name: 'food_portions', columns: ['id', 'fdc_id', 'seq_num', 'amount', 'measure_unit_id', 'portion_description', 'modifier', 'gram_weight'] }
    ];

    for (const table of tableOrder) {
      console.log(`\n📦 Uploading ${table.name}...`);

      const count = localDb.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`   Total rows: ${count.count.toLocaleString()}`);

      if (count.count === 0) {
        console.log(`   ✓ Completed ${table.name} (empty)`);
        continue;
      }

      // Read all rows
      const rows = localDb.prepare(`SELECT * FROM ${table.name}`).all();

      // Use COPY for fast bulk insert
      console.log(`   Preparing bulk insert...`);

      // Build values array for bulk insert
      const BATCH_SIZE = 1000;
      let uploaded = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        // Build parameterized query
        const placeholders = batch.map((_, batchIdx) => {
          const paramNumbers = table.columns.map((_, colIdx) => `$${batchIdx * table.columns.length + colIdx + 1}`);
          return `(${paramNumbers.join(', ')})`;
        }).join(', ');

        const query = `
          INSERT INTO ${table.name} (${table.columns.join(', ')})
          VALUES ${placeholders}
          ON CONFLICT DO NOTHING
        `;

        // Flatten all values
        const values = batch.flatMap(row => table.columns.map(col => row[col]));

        await client.query(query, values);

        uploaded += batch.length;
        process.stdout.write(`   Progress: ${uploaded.toLocaleString()} / ${count.count.toLocaleString()} rows (${Math.round(uploaded / count.count * 100)}%)\r`);
      }

      console.log(`\n   ✓ Completed ${table.name}`);
    }

    console.log('\n\n✅ Database upload complete!');
    console.log('\n📊 Verifying...');

    // Verify
    const foodCount = await client.query('SELECT COUNT(*) as count FROM foods');
    console.log(`   Foods in Postgres: ${parseInt(foodCount.rows[0].count).toLocaleString()}`);

    const nutrientCount = await client.query('SELECT COUNT(*) as count FROM food_nutrients');
    console.log(`   Nutrient records: ${parseInt(nutrientCount.rows[0].count).toLocaleString()}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    throw error;
  } finally {
    localDb.close();
    await client.end();
  }
}

uploadDatabase().catch(console.error);
