#!/usr/bin/env node
/**
 * Split USDA database into Core + Branded category bundles
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const SOURCE_DB = path.join(__dirname, '../public/db/usda-full.sqlite');
const OUTPUT_DIR = path.join(__dirname, '../public/db');

// Category groupings based on branded_food_category
const CATEGORY_BUNDLES = {
  'snacks': [
    'Popcorn, Peanuts, Seeds & Related Snacks',
    'Chips, Pretzels & Snacks',
    'Snack, Energy & Granola Bars',
    'Other Snacks',
    'Wholesome Snacks'
  ],
  'candy': [
    'Candy',
    'Chocolate',
    'Chewing Gum & Mints'
  ],
  'dairy': [
    'Cheese',
    'Yogurt',
    'Milk',
    'Ice Cream & Frozen Yogurt',
    'Cream',
    'Butter & Spread'
  ],
  'bakery': [
    'Breads & Buns',
    'Cookies & Biscuits',
    'Cakes, Cupcakes, Snack Cakes',
    'Crackers & Biscotti',
    'Croissants, Sweet Rolls, Muffins & Other Pastries'
  ],
  'beverages': [
    'Fruit & Vegetable Juice, Nectars & Fruit Drinks',
    'Soda',
    'Water',
    'Other Drinks',
    'Powdered Drinks',
    'Tea Bags',
    'Coffee',
    'Iced & Bottle Tea',
    'Energy, Protein & Muscle Recovery Drinks',
    'Sport Drinks'
  ],
  'condiments': [
    'Pickles, Olives, Peppers & Relishes',
    'Seasoning Mixes, Salts, Marinades & Tenderizers',
    'Dips & Salsa',
    'Ketchup, Mustard, BBQ & Cheese Sauce',
    'Salad Dressing & Mayonnaise',
    'Prepared Pasta & Pizza Sauces',
    'Oriental, Mexican & Ethnic Sauces',
    'Other Cooking Sauces'
  ],
  'grains': [
    'Cereal',
    'Pasta by Shape & Type',
    'Rice',
    'All Noodles'
  ],
  'frozen': [
    'Frozen Dinners & Entrees',
    'Frozen Appetizers & Hors D\'oeuvres',
    'Frozen Vegetables',
    'Frozen Fish & Seafood',
    'Frozen Fruit & Fruit Juice Concentrates',
    'Frozen Poultry, Chicken & Turkey',
    'Frozen Bacon, Sausages & Ribs'
  ],
  'proteins': [
    'Pepperoni, Salami & Cold Cuts',
    'Sausages, Hotdogs & Brats',
    'Other Deli',
    'Fish & Seafood',
    'Canned Seafood',
    'Canned Tuna',
    'Canned Meat'
  ],
  'produce': [
    'Pre-Packaged Fruit & Vegetables',
    'Canned Vegetables',
    'Canned Fruit',
    'Tomatoes',
    'Frozen Vegetables'
  ],
  'other': [] // Catch-all for remaining categories
};

function createDatabaseSchema(db) {
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
}

function optimizeDatabase(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec('VACUUM');
  db.exec('ANALYZE');
}

function createCoreDatabase(sourceDb) {
  console.log('\n🌟 Creating CORE database (SR Legacy + Foundation + Survey)...');

  const coreDbPath = path.join(OUTPUT_DIR, 'usda-core.sqlite');
  const coreDb = new Database(coreDbPath);

  try {
    createDatabaseSchema(coreDb);

    // Copy nutrients (same for all databases)
    console.log('  📋 Copying nutrients...');
    const nutrients = sourceDb.prepare('SELECT * FROM nutrients').all();
    const insertNutrient = coreDb.prepare(`
      INSERT INTO nutrients (id, name, unit_name, nutrient_nbr, rank)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertNutrients = coreDb.transaction((rows) => {
      for (const row of rows) {
        insertNutrient.run(row.id, row.name, row.unit_name, row.nutrient_nbr, row.rank);
      }
    });
    insertNutrients(nutrients);

    // Copy core foods
    console.log('  📦 Copying core foods...');
    const coreFoods = sourceDb.prepare(`
      SELECT * FROM foods
      WHERE data_type IN ('sr_legacy_food', 'foundation_food', 'survey_fndds_food')
    `).all();

    const insertFood = coreDb.prepare(`
      INSERT INTO foods (fdc_id, data_type, description, food_category_id, publication_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertFoods = coreDb.transaction((rows) => {
      for (const row of rows) {
        insertFood.run(row.fdc_id, row.data_type, row.description, row.food_category_id, row.publication_date);
      }
    });
    insertFoods(coreFoods);

    const coreFdcIds = coreFoods.map(f => f.fdc_id);
    const fdcIdList = coreFdcIds.join(',');

    // Copy food nutrients
    console.log('  🔬 Copying food nutrients...');
    const coreNutrients = sourceDb.prepare(`
      SELECT * FROM food_nutrients WHERE fdc_id IN (${fdcIdList})
    `).all();

    const insertFoodNutrient = coreDb.prepare(`
      INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
      VALUES (?, ?, ?, ?)
    `);
    const insertFoodNutrients = coreDb.transaction((rows) => {
      for (const row of rows) {
        insertFoodNutrient.run(row.id, row.fdc_id, row.nutrient_id, row.amount);
      }
    });
    insertFoodNutrients(coreNutrients);

    // Copy food portions
    console.log('  🥄 Copying food portions...');
    const corePortions = sourceDb.prepare(`
      SELECT * FROM food_portions WHERE fdc_id IN (${fdcIdList})
    `).all();

    const insertPortion = coreDb.prepare(`
      INSERT INTO food_portions (id, fdc_id, seq_num, amount, measure_unit_id, portion_description, modifier, gram_weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPortions = coreDb.transaction((rows) => {
      for (const row of rows) {
        insertPortion.run(row.id, row.fdc_id, row.seq_num, row.amount, row.measure_unit_id, row.portion_description, row.modifier, row.gram_weight);
      }
    });
    insertPortions(corePortions);

    optimizeDatabase(coreDb);

    const stats = fs.statSync(coreDbPath);
    console.log(`  ✓ Core database created: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`    ${coreFoods.length.toLocaleString()} foods, ${coreNutrients.length.toLocaleString()} nutrients, ${corePortions.length.toLocaleString()} portions`);

  } finally {
    coreDb.close();
  }
}

function createBrandedBundle(sourceDb, bundleName, categories) {
  console.log(`\n📦 Creating ${bundleName.toUpperCase()} bundle...`);

  const bundleDbPath = path.join(OUTPUT_DIR, `usda-${bundleName}.sqlite`);
  const bundleDb = new Database(bundleDbPath);

  try {
    createDatabaseSchema(bundleDb);

    // Copy nutrients (same for all databases)
    const nutrients = sourceDb.prepare('SELECT * FROM nutrients').all();
    const insertNutrient = bundleDb.prepare(`
      INSERT INTO nutrients (id, name, unit_name, nutrient_nbr, rank)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertNutrients = bundleDb.transaction((rows) => {
      for (const row of rows) {
        insertNutrient.run(row.id, row.name, row.unit_name, row.nutrient_nbr, row.rank);
      }
    });
    insertNutrients(nutrients);

    // Get branded foods for this category
    let brandedFoods;
    if (categories.length === 0) {
      // "other" category - get all foods not in other categories
      const allCategories = Object.values(CATEGORY_BUNDLES)
        .flat()
        .filter(c => c !== '')
        .map(c => `'${c.replace(/'/g, "''")}'`)
        .join(',');

      brandedFoods = sourceDb.prepare(`
        SELECT f.*, bf.*
        FROM foods f
        JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
        WHERE f.data_type = 'branded_food'
        AND (bf.branded_food_category NOT IN (${allCategories}) OR bf.branded_food_category = '')
      `).all();
    } else {
      const categoryList = categories.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      brandedFoods = sourceDb.prepare(`
        SELECT f.*, bf.*
        FROM foods f
        JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
        WHERE f.data_type = 'branded_food'
        AND bf.branded_food_category IN (${categoryList})
      `).all();
    }

    if (brandedFoods.length === 0) {
      console.log(`  ⚠️  No foods found for ${bundleName}, skipping...`);
      bundleDb.close();
      fs.unlinkSync(bundleDbPath);
      return;
    }

    // Insert foods
    console.log(`  📦 Copying ${brandedFoods.length.toLocaleString()} foods...`);
    const insertFood = bundleDb.prepare(`
      INSERT INTO foods (fdc_id, data_type, description, food_category_id, publication_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertBranded = bundleDb.prepare(`
      INSERT INTO branded_foods (
        fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
        ingredients, serving_size, serving_size_unit,
        household_serving_fulltext, branded_food_category, discontinued_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFoods = bundleDb.transaction((rows) => {
      for (const row of rows) {
        insertFood.run(row.fdc_id, row.data_type, row.description, row.food_category_id, row.publication_date);
        insertBranded.run(
          row.fdc_id, row.brand_owner, row.brand_name, row.subbrand_name, row.gtin_upc,
          row.ingredients, row.serving_size, row.serving_size_unit,
          row.household_serving_fulltext, row.branded_food_category, row.discontinued_date
        );
      }
    });
    insertFoods(brandedFoods);

    const fdcIds = brandedFoods.map(f => f.fdc_id);
    const fdcIdList = fdcIds.join(',');

    // Copy food nutrients in batches (too many for single query)
    console.log(`  🔬 Copying food nutrients...`);
    const BATCH_SIZE = 1000;
    const insertFoodNutrient = bundleDb.prepare(`
      INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
      VALUES (?, ?, ?, ?)
    `);

    let totalNutrients = 0;
    for (let i = 0; i < fdcIds.length; i += BATCH_SIZE) {
      const batchIds = fdcIds.slice(i, i + BATCH_SIZE).join(',');
      const nutrients = sourceDb.prepare(`
        SELECT * FROM food_nutrients WHERE fdc_id IN (${batchIds})
      `).all();

      const insertNutrientsBatch = bundleDb.transaction((rows) => {
        for (const row of rows) {
          insertFoodNutrient.run(row.id, row.fdc_id, row.nutrient_id, row.amount);
        }
      });
      insertNutrientsBatch(nutrients);
      totalNutrients += nutrients.length;

      if ((i + BATCH_SIZE) % 10000 === 0) {
        process.stdout.write(`    Progress: ${i.toLocaleString()} / ${fdcIds.length.toLocaleString()} foods\r`);
      }
    }
    console.log(`    ✓ Copied ${totalNutrients.toLocaleString()} nutrient records`);

    optimizeDatabase(bundleDb);

    const stats = fs.statSync(bundleDbPath);
    console.log(`  ✓ ${bundleName} bundle created: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  } finally {
    bundleDb.close();
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('USDA DATABASE SPLITTER');
  console.log('='.repeat(70));

  if (!fs.existsSync(SOURCE_DB)) {
    console.error(`❌ Source database not found: ${SOURCE_DB}`);
    process.exit(1);
  }

  const sourceDb = new Database(SOURCE_DB, { readonly: true });

  try {
    // Create core database
    createCoreDatabase(sourceDb);

    // Create branded bundles
    for (const [bundleName, categories] of Object.entries(CATEGORY_BUNDLES)) {
      createBrandedBundle(sourceDb, bundleName, categories);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Database splitting complete!');
    console.log('='.repeat(70));

    // List all created databases
    console.log('\nCreated databases:');
    const dbFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('usda-') && f.endsWith('.sqlite'));
    let totalSize = 0;
    for (const file of dbFiles) {
      const filePath = path.join(OUTPUT_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      totalSize += sizeMB;
      console.log(`  ${file.padEnd(30)} ${sizeMB.toFixed(2).padStart(10)} MB`);
    }
    console.log(`\nTotal size: ${totalSize.toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    sourceDb.close();
  }
}

main().catch(console.error);
