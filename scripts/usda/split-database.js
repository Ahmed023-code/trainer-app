#!/usr/bin/env node
/**
 * Split USDA Database into Bundles
 * Creates Core + Essentials for offline use
 * Tier 2/3 bundles remain in main DB for online API access
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const SOURCE_DB = path.join(__dirname, '..', '..', 'data', 'usda', 'usda-deduplicated.sqlite');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'db');

console.log('='.repeat(70));
console.log('USDA DATABASE SPLIT SCRIPT');
console.log('='.repeat(70) + '\n');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Copy schema and create new database
 */
function createEmptyDatabase(outputPath) {
  const db = new Database(outputPath);
  db.pragma('journal_mode = WAL');

  // Create schema
  db.exec(`
    CREATE TABLE food (
      fdc_id INTEGER PRIMARY KEY,
      description TEXT,
      data_type TEXT,
      food_category_id INTEGER
    );

    CREATE TABLE branded_food (
      fdc_id INTEGER PRIMARY KEY,
      upc TEXT,
      brand_name TEXT,
      ingredients TEXT,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
    );

    CREATE TABLE nutrient (
      id INTEGER PRIMARY KEY,
      name TEXT,
      unit_name TEXT
    );

    CREATE TABLE food_nutrient (
      id INTEGER PRIMARY KEY,
      fdc_id INTEGER,
      nutrient_id INTEGER,
      amount REAL,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id),
      FOREIGN KEY(nutrient_id) REFERENCES nutrient(id)
    );

    CREATE TABLE food_portion (
      id INTEGER PRIMARY KEY,
      fdc_id INTEGER,
      portion_description TEXT,
      gram_weight REAL,
      FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
    );

    CREATE INDEX idx_food_description ON food(description);
    CREATE INDEX idx_branded_upc ON branded_food(upc);
    CREATE INDEX idx_foodnutrient_fdc ON food_nutrient(fdc_id);
    CREATE INDEX idx_foodnutrient_nutrient ON food_nutrient(nutrient_id);
    CREATE INDEX idx_foodportion_fdc ON food_portion(fdc_id);
  `);

  return db;
}

/**
 * Copy nutrients table (same for all databases)
 */
function copyNutrients(sourceDb, targetDb) {
  const nutrients = sourceDb.prepare('SELECT * FROM nutrient').all();
  const insert = targetDb.prepare('INSERT INTO nutrient (id, name, unit_name) VALUES (?, ?, ?)');

  targetDb.transaction(() => {
    for (const nutrient of nutrients) {
      insert.run(nutrient.id, nutrient.name, nutrient.unit_name);
    }
  })();

  return nutrients.length;
}

/**
 * Copy foods and their related data
 */
function copyFoods(sourceDb, targetDb, whereClause, params = []) {
  console.log(`  Copying foods where: ${whereClause}`);

  // Get food IDs
  const foods = sourceDb.prepare(`SELECT * FROM food WHERE ${whereClause}`).all(...params);
  const fdcIds = foods.map(f => f.fdc_id);

  if (fdcIds.length === 0) {
    console.log('  ⚠️ No foods found');
    return 0;
  }

  console.log(`  Found ${fdcIds.length.toLocaleString()} foods`);

  // Prepare insert statements
  const insertFood = targetDb.prepare(
    'INSERT OR IGNORE INTO food (fdc_id, description, data_type, food_category_id) VALUES (?, ?, ?, ?)'
  );
  const insertBranded = targetDb.prepare(
    'INSERT OR IGNORE INTO branded_food (fdc_id, upc, brand_name, ingredients) VALUES (?, ?, ?, ?)'
  );
  const insertNutrient = targetDb.prepare(
    'INSERT OR IGNORE INTO food_nutrient (id, fdc_id, nutrient_id, amount) VALUES (?, ?, ?, ?)'
  );
  const insertPortion = targetDb.prepare(
    'INSERT OR IGNORE INTO food_portion (id, fdc_id, portion_description, gram_weight) VALUES (?, ?, ?, ?)'
  );

  targetDb.transaction(() => {
    // Copy foods
    for (const food of foods) {
      insertFood.run(food.fdc_id, food.description, food.data_type, food.food_category_id);
    }

    // Copy branded food data
    const placeholders = fdcIds.map(() => '?').join(',');
    const brandedFoods = sourceDb.prepare(
      `SELECT * FROM branded_food WHERE fdc_id IN (${placeholders})`
    ).all(...fdcIds);

    for (const branded of brandedFoods) {
      insertBranded.run(branded.fdc_id, branded.upc, branded.brand_name, branded.ingredients);
    }

    // Copy nutrients
    const nutrients = sourceDb.prepare(
      `SELECT * FROM food_nutrient WHERE fdc_id IN (${placeholders})`
    ).all(...fdcIds);

    for (const nutrient of nutrients) {
      insertNutrient.run(nutrient.id, nutrient.fdc_id, nutrient.nutrient_id, nutrient.amount);
    }

    // Copy portions
    const portions = sourceDb.prepare(
      `SELECT * FROM food_portion WHERE fdc_id IN (${placeholders})`
    ).all(...fdcIds);

    for (const portion of portions) {
      insertPortion.run(portion.id, portion.fdc_id, portion.portion_description, portion.gram_weight);
    }
  })();

  console.log(`  ✓ Copied ${fdcIds.length.toLocaleString()} foods with all related data\n`);
  return fdcIds.length;
}

/**
 * Main execution
 */
async function main() {
  const sourceDb = new Database(SOURCE_DB, { readonly: true });

  try {
    // ========================================
    // BUNDLE 1: CORE FOODS
    // ========================================
    console.log('Creating Core Foods bundle...\n');
    const corePath = path.join(OUTPUT_DIR, 'usda-core.sqlite');
    if (fs.existsSync(corePath)) fs.unlinkSync(corePath);

    const coreDb = createEmptyDatabase(corePath);
    console.log('  Copying nutrients...');
    const nutrientCount = copyNutrients(sourceDb, coreDb);
    console.log(`  ✓ Copied ${nutrientCount.toLocaleString()} nutrients\n`);

    let totalCore = 0;
    totalCore += copyFoods(sourceDb, coreDb, "data_type = 'sr_legacy_food'");
    totalCore += copyFoods(sourceDb, coreDb, "data_type = 'foundation_food'");
    totalCore += copyFoods(sourceDb, coreDb, "data_type = 'survey_fndds_food'");

    console.log('  Optimizing database...');
    coreDb.exec('VACUUM');
    coreDb.exec('ANALYZE');
    coreDb.close();

    const coreSize = (fs.statSync(corePath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✓ Core Foods: ${totalCore.toLocaleString()} foods, ${coreSize} MB\n`);

    // ========================================
    // BUNDLE 2: PROTEINS
    // ========================================
    console.log('Creating Proteins bundle...\n');
    const proteinsPath = path.join(OUTPUT_DIR, 'usda-proteins.sqlite');
    if (fs.existsSync(proteinsPath)) fs.unlinkSync(proteinsPath);

    const proteinsDb = createEmptyDatabase(proteinsPath);
    copyNutrients(sourceDb, proteinsDb);

    const proteinCategories = [
      'Pepperoni, Salami & Cold Cuts',
      'Sausages, Hotdogs & Brats',
      'Bacon, Sausages & Ribs',
      'Poultry, Chicken & Turkey',
      'Other Meats',
      'Fish & Seafood',
      'Frozen Fish & Seafood',
      'Canned Seafood',
      'Canned Tuna',
      'Canned Meat',
      'Other Deli',
      'Frozen Poultry, Chicken & Turkey',
      'Frozen Bacon, Sausages & Ribs',
      'Frozen Sausages, Hotdogs & Brats',
      'Other Frozen Meats',
      'Shellfish Unprepared/Unprocessed',
      'Fish  Unprepared/Unprocessed',
      'Fish – Unprepared/Unprocessed',
      'Meat/Poultry/Other Animals  Prepared/Processed',
      'Meat/Poultry/Other Animals - Prepared/Processed',
      'Meat/Poultry/Other Animals – Prepared/Processed',
      'Meat/Poultry/Other Animals  Unprepared/Unprocessed',
      'Meat/Poultry/Other Animals – Unprepared/Unprocessed',
      'Meat/Poultry/Other Animals Sausages  Prepared/Processed',
      'Meat/Poultry/Other Animals Sausages - Prepared/Processed',
      'Meat/Poultry/Other Animals Sausages – Prepared/Processed'
    ];

    let totalProteins = 0;
    for (const category of proteinCategories) {
      totalProteins += copyFoods(sourceDb, proteinsDb, "food_category_id = ?", [category]);
    }

    proteinsDb.exec('VACUUM');
    proteinsDb.exec('ANALYZE');
    proteinsDb.close();

    const proteinsSize = (fs.statSync(proteinsPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✓ Proteins: ${totalProteins.toLocaleString()} foods, ${proteinsSize} MB\n`);

    // ========================================
    // BUNDLE 3: DAIRY
    // ========================================
    console.log('Creating Dairy bundle...\n');
    const dairyPath = path.join(OUTPUT_DIR, 'usda-dairy.sqlite');
    if (fs.existsSync(dairyPath)) fs.unlinkSync(dairyPath);

    const dairyDb = createEmptyDatabase(dairyPath);
    copyNutrients(sourceDb, dairyDb);

    const dairyCategories = [
      'Cheese',
      'Yogurt',
      'Milk',
      'Cream',
      'Butter & Spread',
      'Eggs & Egg Substitutes',
      'Plant Based Milk',
      'Ice Cream & Frozen Yogurt',
      'Yogurt/Yogurt Substitutes',
      'Cheese/Cheese Substitutes',
      'Butter/Butter Substitutes',
      'Cream/Cream Substitutes'
    ];

    let totalDairy = 0;
    for (const category of dairyCategories) {
      totalDairy += copyFoods(sourceDb, dairyDb, "food_category_id = ?", [category]);
    }

    dairyDb.exec('VACUUM');
    dairyDb.exec('ANALYZE');
    dairyDb.close();

    const dairySize = (fs.statSync(dairyPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✓ Dairy: ${totalDairy.toLocaleString()} foods, ${dairySize} MB\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(70));
    console.log('OFFLINE BUNDLES CREATED (Core + Essentials)');
    console.log('='.repeat(70));
    console.log(`Core Foods:  ${totalCore.toLocaleString().padStart(8)} foods | ${coreSize.padStart(8)} MB`);
    console.log(`Proteins:    ${totalProteins.toLocaleString().padStart(8)} foods | ${proteinsSize.padStart(8)} MB`);
    console.log(`Dairy:       ${totalDairy.toLocaleString().padStart(8)} foods | ${dairySize.padStart(8)} MB`);
    console.log('-'.repeat(70));
    const totalFoods = totalCore + totalProteins + totalDairy;
    const totalSize = (parseFloat(coreSize) + parseFloat(proteinsSize) + parseFloat(dairySize)).toFixed(2);
    console.log(`TOTAL:       ${totalFoods.toLocaleString().padStart(8)} foods | ${totalSize.padStart(8)} MB`);
    console.log('='.repeat(70));
    console.log(`\n✓ Offline bundles saved to: ${OUTPUT_DIR}\n`);
    console.log('Note: Tier 2/3 categories remain in usda-deduplicated.sqlite for API access\n');

  } catch (err) {
    console.error(`\n✗ Error: ${err.message}`);
    throw err;
  } finally {
    sourceDb.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
