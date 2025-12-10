#!/usr/bin/env node
/**
 * Build a curated database with ~50K-100K best foods
 * Strategy:
 * 1. Include ALL core foods (SR Legacy, Foundation, Survey)
 * 2. Include popular branded foods from major brands
 * 3. Exclude discontinued foods
 * 4. Prioritize foods with complete nutrition data
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const FULL_DB = path.join(__dirname, '../public/db/usda-full.sqlite');
const OUTPUT_DB = path.join(__dirname, '../public/db/usda-curated.sqlite');

// Target: 50K-100K foods
const MAX_BRANDED_FOODS = 86364; // ~100K total (13,636 core + 86,364 branded)

// Major food brands to prioritize
const PRIORITY_BRANDS = [
  'General Mills',
  'Kellogg',
  'Kraft',
  'Nestle',
  'Pepsi',
  'Coca-Cola',
  'Unilever',
  'Mars',
  'Danone',
  'Mondelez',
  'Campbell',
  'ConAgra',
  'Hershey',
  'Post',
  'Quaker',
  'Starbucks',
  'Chobani',
  'Yoplait',
  'Frito-Lay',
  'Doritos',
  'Lay\'s',
  'Cheetos',
  'Oreo',
  'Ritz',
  'Triscuit',
  'Wheat Thins',
  'Cheerios',
  'Lucky Charms',
  'Frosted Flakes',
  'Special K'
];

async function buildCuratedDatabase() {
  console.log('🚀 Building curated database...\n');

  // Open source database
  const sourceDb = new Database(FULL_DB, { readonly: true });

  // Remove existing curated database
  if (fs.existsSync(OUTPUT_DB)) {
    console.log('🗑️  Removing existing curated database...');
    fs.unlinkSync(OUTPUT_DB);
  }

  // Create new database
  const targetDb = new Database(OUTPUT_DB);

  try {
    console.log('📋 Creating schema...');

    // Create tables
    targetDb.exec(`
      CREATE TABLE nutrients (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        unit_name TEXT,
        nutrient_nbr TEXT,
        rank REAL
      );

      CREATE TABLE foods (
        fdc_id INTEGER PRIMARY KEY,
        data_type TEXT NOT NULL,
        description TEXT NOT NULL,
        food_category_id TEXT,
        publication_date TEXT
      );

      CREATE TABLE branded_foods (
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

      CREATE TABLE food_nutrients (
        id INTEGER PRIMARY KEY,
        fdc_id INTEGER NOT NULL,
        nutrient_id INTEGER NOT NULL,
        amount REAL,
        FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id),
        FOREIGN KEY (nutrient_id) REFERENCES nutrients(id)
      );

      CREATE TABLE food_portions (
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
    targetDb.exec(`
      CREATE INDEX idx_foods_data_type ON foods(data_type);
      CREATE INDEX idx_foods_description ON foods(description);
      CREATE INDEX idx_branded_gtin ON branded_foods(gtin_upc);
      CREATE INDEX idx_food_nutrients_fdc ON food_nutrients(fdc_id);
      CREATE INDEX idx_food_nutrients_nutrient ON food_nutrients(nutrient_id);
      CREATE INDEX idx_food_portions_fdc ON food_portions(fdc_id);
    `);

    // Copy all nutrients
    console.log('\n🧪 Copying nutrients...');
    const nutrients = sourceDb.prepare('SELECT * FROM nutrients').all();
    const insertNutrient = targetDb.prepare(`
      INSERT INTO nutrients (id, name, unit_name, nutrient_nbr, rank)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertNutrients = targetDb.transaction((nutrients) => {
      for (const n of nutrients) {
        insertNutrient.run(n.id, n.name, n.unit_name, n.nutrient_nbr, n.rank);
      }
    });
    insertNutrients(nutrients);
    console.log(`   ✓ Copied ${nutrients.length.toLocaleString()} nutrients`);

    // Step 1: Copy ALL core foods (non-branded)
    console.log('\n📦 Step 1: Copying core foods (SR Legacy, Foundation, Survey)...');
    const coreFoods = sourceDb.prepare(`
      SELECT * FROM foods
      WHERE data_type IN ('sr_legacy_food', 'foundation_food', 'survey_fndds_food')
    `).all();

    const insertFood = targetDb.prepare(`
      INSERT INTO foods (fdc_id, data_type, description, food_category_id, publication_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertFoods = targetDb.transaction((foods) => {
      for (const f of foods) {
        insertFood.run(f.fdc_id, f.data_type, f.description, f.food_category_id, f.publication_date);
      }
    });
    insertFoods(coreFoods);
    console.log(`   ✓ Copied ${coreFoods.length.toLocaleString()} core foods`);

    // Step 2: Select best branded foods
    console.log('\n🏷️  Step 2: Selecting best branded foods...');

    // Build priority brand filter
    const brandFilter = PRIORITY_BRANDS.map(() => 'brand_owner LIKE ? OR brand_name LIKE ?').join(' OR ');
    const brandParams = PRIORITY_BRANDS.flatMap(brand => [`%${brand}%`, `%${brand}%`]);

    // Get branded foods with priority
    const brandedFoods = sourceDb.prepare(`
      SELECT f.*, bf.brand_owner, bf.brand_name,
        CASE
          WHEN (${brandFilter}) THEN 1
          ELSE 2
        END as priority
      FROM foods f
      JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
      WHERE f.data_type = 'branded_food'
        AND (bf.discontinued_date IS NULL OR bf.discontinued_date = '')
      ORDER BY priority ASC, f.fdc_id ASC
      LIMIT ?
    `).all(...brandParams, MAX_BRANDED_FOODS);

    insertFoods(brandedFoods);
    console.log(`   ✓ Selected ${brandedFoods.length.toLocaleString()} branded foods`);

    const priorityCount = brandedFoods.filter(f => f.priority === 1).length;
    console.log(`      - ${priorityCount.toLocaleString()} from priority brands`);
    console.log(`      - ${(brandedFoods.length - priorityCount).toLocaleString()} others`);

    // Collect all selected FDC IDs
    const allFdcIds = new Set([
      ...coreFoods.map(f => f.fdc_id),
      ...brandedFoods.map(f => f.fdc_id)
    ]);

    console.log(`\n📊 Total foods selected: ${allFdcIds.size.toLocaleString()}`);

    // Step 3: Copy branded_foods table
    console.log('\n🏪 Step 3: Copying branded food details...');
    const brandedDetails = sourceDb.prepare(`
      SELECT * FROM branded_foods
      WHERE fdc_id IN (${Array.from(allFdcIds).join(',')})
    `).all();

    const insertBranded = targetDb.prepare(`
      INSERT INTO branded_foods (
        fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
        ingredients, serving_size, serving_size_unit,
        household_serving_fulltext, branded_food_category, discontinued_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBrandeds = targetDb.transaction((branded) => {
      for (const b of branded) {
        insertBranded.run(
          b.fdc_id, b.brand_owner, b.brand_name, b.subbrand_name, b.gtin_upc,
          b.ingredients, b.serving_size, b.serving_size_unit,
          b.household_serving_fulltext, b.branded_food_category, b.discontinued_date
        );
      }
    });
    insertBrandeds(brandedDetails);
    console.log(`   ✓ Copied ${brandedDetails.length.toLocaleString()} branded food details`);

    // Step 4: Copy nutrients
    console.log('\n🔬 Step 4: Copying food nutrients...');
    const BATCH_SIZE = 10000;
    const fdcIdArray = Array.from(allFdcIds);
    let totalNutrients = 0;

    const insertNutrientRecord = targetDb.prepare(`
      INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
      VALUES (?, ?, ?, ?)
    `);
    const insertNutrientRecords = targetDb.transaction((records) => {
      for (const r of records) {
        insertNutrientRecord.run(r.id, r.fdc_id, r.nutrient_id, r.amount);
      }
    });

    for (let i = 0; i < fdcIdArray.length; i += BATCH_SIZE) {
      const batch = fdcIdArray.slice(i, i + BATCH_SIZE);
      const nutrientRecords = sourceDb.prepare(`
        SELECT * FROM food_nutrients
        WHERE fdc_id IN (${batch.join(',')})
      `).all();

      insertNutrientRecords(nutrientRecords);
      totalNutrients += nutrientRecords.length;

      process.stdout.write(`   Progress: ${i + batch.length} / ${fdcIdArray.length} foods (${totalNutrients.toLocaleString()} nutrients)...\r`);
    }
    console.log(`\n   ✓ Copied ${totalNutrients.toLocaleString()} nutrient records`);

    // Step 5: Copy portions
    console.log('\n📏 Step 5: Copying food portions...');
    let totalPortions = 0;

    const insertPortion = targetDb.prepare(`
      INSERT INTO food_portions (id, fdc_id, seq_num, amount, measure_unit_id, portion_description, modifier, gram_weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPortions = targetDb.transaction((portions) => {
      for (const p of portions) {
        insertPortion.run(p.id, p.fdc_id, p.seq_num, p.amount, p.measure_unit_id, p.portion_description, p.modifier, p.gram_weight);
      }
    });

    for (let i = 0; i < fdcIdArray.length; i += BATCH_SIZE) {
      const batch = fdcIdArray.slice(i, i + BATCH_SIZE);
      const portionRecords = sourceDb.prepare(`
        SELECT * FROM food_portions
        WHERE fdc_id IN (${batch.join(',')})
      `).all();

      insertPortions(portionRecords);
      totalPortions += portionRecords.length;

      process.stdout.write(`   Progress: ${i + batch.length} / ${fdcIdArray.length} foods (${totalPortions.toLocaleString()} portions)...\r`);
    }
    console.log(`\n   ✓ Copied ${totalPortions.toLocaleString()} portion records`);

    // Optimize database
    console.log('\n⚡ Optimizing database...');
    targetDb.exec('VACUUM');
    targetDb.exec('ANALYZE');

    // Final stats
    const finalStats = {
      foods: targetDb.prepare('SELECT COUNT(*) as count FROM foods').get().count,
      branded: targetDb.prepare('SELECT COUNT(*) as count FROM branded_foods').get().count,
      nutrients: targetDb.prepare('SELECT COUNT(*) as count FROM food_nutrients').get().count,
      portions: targetDb.prepare('SELECT COUNT(*) as count FROM food_portions').get().count
    };

    const fileSize = fs.statSync(OUTPUT_DB).size / (1024 * 1024);

    console.log('\n✅ Curated database created successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`   Foods: ${finalStats.foods.toLocaleString()}`);
    console.log(`   Branded Foods: ${finalStats.branded.toLocaleString()}`);
    console.log(`   Nutrient Records: ${finalStats.nutrients.toLocaleString()}`);
    console.log(`   Portion Records: ${finalStats.portions.toLocaleString()}`);
    console.log(`   File Size: ${fileSize.toFixed(2)} MB`);
    console.log(`\n💾 Saved to: ${OUTPUT_DB}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    sourceDb.close();
    targetDb.close();
  }
}

buildCuratedDatabase().catch(console.error);
