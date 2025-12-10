#!/usr/bin/env node
/**
 * USDA FoodData Central SQLite Database Builder
 * Imports CSV files from USDA/FOODS/ into a local SQLite database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const USDA_FOLDER = path.join(__dirname, '..', '..', 'USDA', 'FOODS');
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'usda', 'usda.sqlite');

// CSV to Table mappings
const CSV_MAPPINGS = {
  'food.csv': {
    table: 'food',
    columns: ['fdc_id', 'description', 'data_type', 'food_category_id'],
    csvColumns: ['fdc_id', 'description', 'data_type', 'food_category_id']
  },
  'branded_food.csv': {
    table: 'branded_food',
    columns: ['fdc_id', 'upc', 'brand_name', 'ingredients'],
    csvColumns: ['fdc_id', 'gtin_upc', 'brand_name', 'ingredients']
  },
  'nutrient.csv': {
    table: 'nutrient',
    columns: ['id', 'name', 'unit_name'],
    csvColumns: ['id', 'name', 'unit_name']
  },
  'food_nutrient.csv': {
    table: 'food_nutrient',
    columns: ['id', 'fdc_id', 'nutrient_id', 'amount'],
    csvColumns: ['id', 'fdc_id', 'nutrient_id', 'amount']
  },
  'food_portion.csv': {
    table: 'food_portion',
    columns: ['id', 'fdc_id', 'portion_description', 'gram_weight'],
    csvColumns: ['id', 'fdc_id', 'portion_description', 'gram_weight']
  }
};

/**
 * Parse CSV line manually (handles quoted fields with commas)
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

/**
 * Create database schema
 */
function createSchema(db) {
  console.log('Creating database schema...');

  // Drop existing tables
  db.exec('DROP TABLE IF EXISTS food_portion');
  db.exec('DROP TABLE IF EXISTS food_nutrient');
  db.exec('DROP TABLE IF EXISTS branded_food');
  db.exec('DROP TABLE IF EXISTS nutrient');
  db.exec('DROP TABLE IF EXISTS food');

  // Create tables
  db.exec(`
    CREATE TABLE food (
      fdc_id INTEGER PRIMARY KEY,
      description TEXT,
      data_type TEXT,
      food_category_id INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE branded_food (
      fdc_id INTEGER PRIMARY KEY,
      upc TEXT,
      brand_name TEXT,
      ingredients TEXT,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
    )
  `);

  db.exec(`
    CREATE TABLE nutrient (
      id INTEGER PRIMARY KEY,
      name TEXT,
      unit_name TEXT
    )
  `);

  db.exec(`
    CREATE TABLE food_nutrient (
      id INTEGER PRIMARY KEY,
      fdc_id INTEGER,
      nutrient_id INTEGER,
      amount REAL,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id),
      FOREIGN KEY(nutrient_id) REFERENCES nutrient(id)
    )
  `);

  db.exec(`
    CREATE TABLE food_portion (
      id INTEGER PRIMARY KEY,
      fdc_id INTEGER,
      portion_description TEXT,
      gram_weight REAL,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
    )
  `);

  console.log('✓ Schema created successfully\n');
}

/**
 * Import CSV file into database
 */
async function importCSV(db, csvFile, tableName, columns, csvColumns) {
  const csvPath = path.join(USDA_FOLDER, csvFile);

  if (!fs.existsSync(csvPath)) {
    console.log(`✗ File not found: ${csvPath}`);
    return 0;
  }

  console.log(`Importing ${csvFile} into ${tableName}...`);

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  let headerMap = null;
  const batchSize = 10000;
  let batch = [];

  // Prepare statement
  const placeholders = columns.map(() => '?').join(',');
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`
  );

  // Start transaction
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });

  for await (const line of rl) {
    if (!headerMap) {
      // Parse header
      const headers = parseCSVLine(line);
      headerMap = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });
      continue;
    }

    try {
      const values = parseCSVLine(line);
      const row = [];

      // Extract only needed columns
      for (const csvCol of csvColumns) {
        const index = headerMap[csvCol];
        let val = index !== undefined ? values[index] : '';
        val = val.trim();
        // Convert empty strings to null
        if (val === '') {
          val = null;
        }
        row.push(val);
      }

      batch.push(row);
      rowCount++;

      // Batch insert for performance
      if (batch.length >= batchSize) {
        insertMany(batch);
        batch = [];

        if (rowCount % 100000 === 0) {
          process.stdout.write(`  ${rowCount.toLocaleString()} rows processed...\r`);
        }
      }
    } catch (err) {
      // Skip problematic rows
      continue;
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    insertMany(batch);
  }

  console.log(`✓ Imported ${rowCount.toLocaleString()} rows into ${tableName}      `);
  return rowCount;
}

/**
 * Create performance indexes
 */
function createIndexes(db) {
  console.log('\nCreating indexes...');

  db.exec('CREATE INDEX IF NOT EXISTS idx_food_description ON food(description)');
  console.log('  ✓ Created index on food.description');

  db.exec('CREATE INDEX IF NOT EXISTS idx_branded_upc ON branded_food(upc)');
  console.log('  ✓ Created index on branded_food.upc');

  db.exec('CREATE INDEX IF NOT EXISTS idx_foodnutrient_fdc ON food_nutrient(fdc_id)');
  console.log('  ✓ Created index on food_nutrient.fdc_id');

  db.exec('CREATE INDEX IF NOT EXISTS idx_foodnutrient_nutrient ON food_nutrient(nutrient_id)');
  console.log('  ✓ Created index on food_nutrient.nutrient_id');

  db.exec('CREATE INDEX IF NOT EXISTS idx_foodportion_fdc ON food_portion(fdc_id)');
  console.log('  ✓ Created index on food_portion.fdc_id');

  console.log('✓ All indexes created');
}

/**
 * Verify database with test queries
 */
function verifyDatabase(db) {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION TESTS');
  console.log('='.repeat(60));

  // Test 1: Count records
  console.log('\n1. Record counts:');
  const tables = ['food', 'branded_food', 'nutrient', 'food_nutrient', 'food_portion'];
  for (const table of tables) {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`   ${table}: ${result.count.toLocaleString()} records`);
  }

  // Test 2: Search food by name
  console.log('\n2. Search test (chicken):');
  const foods = db.prepare(`SELECT fdc_id, description FROM food WHERE description LIKE '%chicken%' LIMIT 5`).all();
  for (const food of foods) {
    console.log(`   ${food.fdc_id}: ${food.description}`);
  }

  // Test 3: Get nutrients for first food
  console.log('\n3. Nutrient lookup test:');
  const firstFood = db.prepare('SELECT fdc_id FROM food LIMIT 1').get();
  const nutrients = db.prepare(`
    SELECT n.name, fn.amount, n.unit_name
    FROM food_nutrient fn
    JOIN nutrient n ON fn.nutrient_id = n.id
    WHERE fn.fdc_id = ?
    LIMIT 10
  `).all(firstFood.fdc_id);

  console.log(`   Nutrients for fdc_id ${firstFood.fdc_id}:`);
  for (const nutrient of nutrients) {
    console.log(`   - ${nutrient.name}: ${nutrient.amount} ${nutrient.unit_name}`);
  }

  // Test 4: Barcode lookup
  console.log('\n4. Barcode lookup test:');
  const branded = db.prepare(`
    SELECT fdc_id, upc, brand_name
    FROM branded_food
    WHERE upc IS NOT NULL
    LIMIT 5
  `).all();
  for (const item of branded) {
    console.log(`   UPC ${item.upc}: ${item.brand_name} (fdc_id: ${item.fdc_id})`);
  }

  // Test 5: Portion sizes
  console.log('\n5. Portion size test:');
  const portions = db.prepare(`
    SELECT f.description, fp.portion_description, fp.gram_weight
    FROM food_portion fp
    JOIN food f ON fp.fdc_id = f.fdc_id
    WHERE fp.gram_weight IS NOT NULL
    LIMIT 5
  `).all();
  for (const portion of portions) {
    const desc = portion.description.substring(0, 40);
    console.log(`   ${desc}: ${portion.portion_description} = ${portion.gram_weight}g`);
  }

  // Database size
  console.log('\n6. Database statistics:');
  const stats = fs.statSync(DB_PATH);
  const sizeMB = stats.size / (1024 * 1024);
  console.log(`   Database size: ${sizeMB.toFixed(2)} MB`);

  console.log('\n' + '='.repeat(60));
  console.log('✓ All verification tests completed');
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('USDA FOODDATA CENTRAL SQLITE DATABASE BUILDER');
  console.log('='.repeat(60) + '\n');

  // Remove old database
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log(`Removed existing database: ${DB_PATH}\n`);
  }

  // Create database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  try {
    // Step 1: Create schema
    createSchema(db);

    // Step 2: Import CSVs
    console.log('='.repeat(60));
    console.log('IMPORTING CSV FILES');
    console.log('='.repeat(60) + '\n');

    for (const [csvFile, config] of Object.entries(CSV_MAPPINGS)) {
      await importCSV(db, csvFile, config.table, config.columns, config.csvColumns);
    }

    // Step 3: Create indexes
    console.log('\n' + '='.repeat(60));
    console.log('CREATING INDEXES');
    console.log('='.repeat(60));
    createIndexes(db);

    // Step 4: Optimize database
    console.log('\nOptimizing database...');
    db.exec('VACUUM');
    db.exec('ANALYZE');
    console.log('✓ Database optimized');

    // Step 5: Verify
    verifyDatabase(db);

    console.log(`\n✓ Database build completed successfully!`);
    console.log(`✓ Output: ${DB_PATH}`);

  } catch (err) {
    console.error(`\n✗ Error: ${err.message}`);
    throw err;
  } finally {
    db.close();
  }
}

// Run
main().catch(err => {
  console.error(err);
  process.exit(1);
});
