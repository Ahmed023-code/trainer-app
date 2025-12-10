#!/usr/bin/env node
/**
 * Build USDA SQLite databases from FoodData Central CSV files.
 * Filters out useless data types (sub-samples, market acquisitions, experimental foods).
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { parse } = require('csv-parse/sync');
const readline = require('readline');

// Paths
const CSV_DIR = 'FoodData_Central_csv_2025-04-24';
const OUTPUT_DIR = 'public/db';

// Food types to KEEP
const USEFUL_FOOD_TYPES = new Set([
  'sr_legacy_food',
  'foundation_food',
  'survey_fndds_food',
  'branded_food'
]);

// Food types to SKIP
const SKIP_FOOD_TYPES = new Set([
  'sub_sample_food',
  'market_acquistion',  // Note: typo in actual data
  'agricultural_acquisition',
  'experimental_food',
  'sample_food'
]);

function createDatabaseSchema(db) {
  console.log('Creating database schema...');

  db.exec(`
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

    CREATE TABLE IF NOT EXISTS nutrients (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      unit_name TEXT,
      nutrient_nbr TEXT,
      rank REAL
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

    CREATE INDEX IF NOT EXISTS idx_foods_data_type ON foods(data_type);
    CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description);
    CREATE INDEX IF NOT EXISTS idx_branded_gtin ON branded_foods(gtin_upc);
    CREATE INDEX IF NOT EXISTS idx_food_nutrients_fdc ON food_nutrients(fdc_id);
    CREATE INDEX IF NOT EXISTS idx_food_nutrients_nutrient ON food_nutrients(nutrient_id);
    CREATE INDEX IF NOT EXISTS idx_food_portions_fdc ON food_portions(fdc_id);
  `);

  console.log('✓ Database schema created\n');
}

function readCsvFile(filepath) {
  console.log(`Reading ${path.basename(filepath)}...`);
  const content = fs.readFileSync(filepath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    escape: '"',
    quote: '"'
  });
}

function insertFoods(db, csvDir) {
  console.log('📦 Processing foods.csv...');

  const foods = readCsvFile(path.join(csvDir, 'food.csv'));
  const usefulFdcIds = new Set();

  const insertStmt = db.prepare(`
    INSERT INTO foods (fdc_id, data_type, description, food_category_id, publication_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  let kept = 0;
  let skipped = 0;

  const insertMany = db.transaction((foods) => {
    for (const food of foods) {
      const dataType = food.data_type;

      if (USEFUL_FOOD_TYPES.has(dataType)) {
        insertStmt.run(
          food.fdc_id,
          dataType,
          food.description,
          food.food_category_id || '',
          food.publication_date || ''
        );
        usefulFdcIds.add(parseInt(food.fdc_id));
        kept++;
      } else {
        skipped++;
      }
    }
  });

  insertMany(foods);

  console.log(`  ✓ Kept: ${kept.toLocaleString()} foods`);
  console.log(`  ✗ Skipped: ${skipped.toLocaleString()} foods (${Array.from(SKIP_FOOD_TYPES).join(', ')})\n`);

  return usefulFdcIds;
}

async function insertBrandedFoods(db, csvDir, usefulFdcIds) {
  console.log('🏷️  Processing branded_food.csv...');

  const insertStmt = db.prepare(`
    INSERT INTO branded_foods (
      fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
      ingredients, serving_size, serving_size_unit,
      household_serving_fulltext, branded_food_category, discontinued_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let kept = 0;
  let skipped = 0;
  let batch = [];
  const BATCH_SIZE = 5000;

  const insertBatch = db.transaction((batch) => {
    for (const food of batch) {
      insertStmt.run(
        food.fdc_id,
        food.brand_owner,
        food.brand_name,
        food.subbrand_name,
        food.gtin_upc,
        food.ingredients,
        food.serving_size,
        food.serving_size_unit,
        food.household_serving_fulltext,
        food.branded_food_category,
        food.discontinued_date
      );
    }
  });

  // Stream the file line by line
  const filepath = path.join(csvDir, 'branded_food.csv');
  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) {
      // Parse headers
      headers = line.replace(/"/g, '').split(',');
      continue;
    }

    // Simple CSV parsing (handle quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    // Create object from headers and values
    const food = {};
    headers.forEach((header, i) => {
      food[header] = values[i] || '';
    });

    const fdcId = parseInt(food.fdc_id);

    if (usefulFdcIds.has(fdcId)) {
      // Skip discontinued foods
      if (food.discontinued_date) {
        skipped++;
        continue;
      }

      batch.push({
        fdc_id: fdcId,
        brand_owner: food.brand_owner || '',
        brand_name: food.brand_name || '',
        subbrand_name: food.subbrand_name || '',
        gtin_upc: food.gtin_upc || '',
        ingredients: food.ingredients || '',
        serving_size: food.serving_size ? parseFloat(food.serving_size) : null,
        serving_size_unit: food.serving_size_unit || '',
        household_serving_fulltext: food.household_serving_fulltext || '',
        branded_food_category: food.branded_food_category || '',
        discontinued_date: food.discontinued_date || ''
      });
      kept++;

      if (batch.length >= BATCH_SIZE) {
        insertBatch(batch);
        process.stdout.write(`  Progress: ${kept.toLocaleString()} branded foods inserted...\r`);
        batch = [];
      }
    } else {
      skipped++;
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    insertBatch(batch);
  }

  console.log(`\n  ✓ Kept: ${kept.toLocaleString()} branded foods`);
  console.log(`  ✗ Skipped: ${skipped.toLocaleString()} (discontinued or useless)\n`);
}

function insertNutrients(db, csvDir) {
  console.log('🧪 Processing nutrient.csv...');

  const nutrients = readCsvFile(path.join(csvDir, 'nutrient.csv'));

  const insertStmt = db.prepare(`
    INSERT INTO nutrients (id, name, unit_name, nutrient_nbr, rank)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((nutrients) => {
    for (const nutrient of nutrients) {
      insertStmt.run(
        nutrient.id,
        nutrient.name,
        nutrient.unit_name || '',
        nutrient.nutrient_nbr || '',
        nutrient.rank ? parseFloat(nutrient.rank) : null
      );
    }
  });

  insertMany(nutrients);

  console.log(`  ✓ Inserted ${nutrients.length.toLocaleString()} nutrients\n`);
}

async function insertFoodNutrients(db, csvDir, usefulFdcIds) {
  console.log('🔬 Processing food_nutrient.csv (this will take a while)...');

  const insertStmt = db.prepare(`
    INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
    VALUES (?, ?, ?, ?)
  `);

  let kept = 0;
  let skipped = 0;
  let batch = [];
  const BATCH_SIZE = 10000;

  const insertBatch = db.transaction((batch) => {
    for (const row of batch) {
      insertStmt.run(row.id, row.fdc_id, row.nutrient_id, row.amount);
    }
  });

  // Stream the file line by line
  const filepath = path.join(csvDir, 'food_nutrient.csv');
  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) {
      // Parse headers
      headers = line.replace(/"/g, '').split(',');
      continue;
    }

    // Simple CSV parsing (handle quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    // Create object from headers and values
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    const fdcId = parseInt(row.fdc_id);

    if (usefulFdcIds.has(fdcId)) {
      batch.push({
        id: row.id,
        fdc_id: fdcId,
        nutrient_id: row.nutrient_id,
        amount: row.amount ? parseFloat(row.amount) : null
      });
      kept++;

      if (batch.length >= BATCH_SIZE) {
        insertBatch(batch);
        process.stdout.write(`  Progress: ${kept.toLocaleString()} nutrient records inserted...\r`);
        batch = [];
      }
    } else {
      skipped++;
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    insertBatch(batch);
  }

  console.log(`\n  ✓ Kept: ${kept.toLocaleString()} nutrient records`);
  console.log(`  ✗ Skipped: ${skipped.toLocaleString()} (for useless foods)\n`);
}

function insertFoodPortions(db, csvDir, usefulFdcIds) {
  console.log('🥄 Processing food_portion.csv...');

  const portions = readCsvFile(path.join(csvDir, 'food_portion.csv'));

  const insertStmt = db.prepare(`
    INSERT INTO food_portions (
      id, fdc_id, seq_num, amount, measure_unit_id,
      portion_description, modifier, gram_weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let kept = 0;
  let skipped = 0;

  const insertMany = db.transaction((portions) => {
    for (const portion of portions) {
      const fdcId = parseInt(portion.fdc_id);

      if (usefulFdcIds.has(fdcId)) {
        insertStmt.run(
          portion.id,
          fdcId,
          portion.seq_num ? parseInt(portion.seq_num) : null,
          portion.amount ? parseFloat(portion.amount) : null,
          portion.measure_unit_id ? parseInt(portion.measure_unit_id) : null,
          portion.portion_description || '',
          portion.modifier || '',
          portion.gram_weight ? parseFloat(portion.gram_weight) : null
        );
        kept++;
      } else {
        skipped++;
      }
    }
  });

  insertMany(portions);

  console.log(`  ✓ Kept: ${kept.toLocaleString()} portions`);
  console.log(`  ✗ Skipped: ${skipped.toLocaleString()} (for useless foods)\n`);
}

function optimizeDatabase(db) {
  console.log('⚡ Optimizing database...');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec('VACUUM');
  db.exec('ANALYZE');
  console.log('  ✓ Database optimized\n');
}

function getDatabaseStats(db) {
  console.log('📊 Database Statistics:');
  console.log('='.repeat(50));

  const foodsByType = db.prepare('SELECT COUNT(*) as count, data_type FROM foods GROUP BY data_type').all();
  for (const row of foodsByType) {
    console.log(`  ${row.data_type}: ${row.count.toLocaleString()} foods`);
  }

  const totalFoods = db.prepare('SELECT COUNT(*) as count FROM foods').get();
  console.log(`\n  Total foods: ${totalFoods.count.toLocaleString()}`);

  const totalNutrients = db.prepare('SELECT COUNT(*) as count FROM food_nutrients').get();
  console.log(`  Total nutrient records: ${totalNutrients.count.toLocaleString()}`);

  const totalPortions = db.prepare('SELECT COUNT(*) as count FROM food_portions').get();
  console.log(`  Total portion records: ${totalPortions.count.toLocaleString()}`);

  const totalBranded = db.prepare('SELECT COUNT(*) as count FROM branded_foods').get();
  console.log(`  Total branded foods: ${totalBranded.count.toLocaleString()}`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('USDA Database Builder');
  console.log('='.repeat(50));
  console.log();

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Create database
  const dbPath = path.join(OUTPUT_DIR, 'usda-full.sqlite');
  console.log(`📁 Creating database: ${dbPath}\n`);

  const db = new Database(dbPath);

  try {
    // Create schema
    createDatabaseSchema(db);

    // Insert data (in order of dependencies)
    const usefulFdcIds = insertFoods(db, CSV_DIR);
    await insertBrandedFoods(db, CSV_DIR, usefulFdcIds);
    insertNutrients(db, CSV_DIR);
    await insertFoodNutrients(db, CSV_DIR, usefulFdcIds);
    insertFoodPortions(db, CSV_DIR, usefulFdcIds);

    // Optimize
    optimizeDatabase(db);

    // Stats
    getDatabaseStats(db);

    // Get file size
    const stats = fs.statSync(dbPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`\n💾 Database size: ${fileSizeMB.toFixed(2)} MB`);

    console.log('\n✅ Database created successfully!');
    console.log(`   Location: ${dbPath}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

main().catch(console.error);
