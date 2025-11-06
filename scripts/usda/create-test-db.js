#!/usr/bin/env node
/**
 * Create a small test database with sample foods for faster testing
 */

const Database = require('better-sqlite3');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, '..', '..', 'public', 'usda-test.sqlite');
const FULL_DB_PATH = path.join(__dirname, '..', '..', 'data', 'usda', 'usda.sqlite');

console.log('Creating test database with sample foods...\n');

// Open full database
const fullDb = new Database(FULL_DB_PATH, { readonly: true });

// Create test database
const testDb = new Database(TEST_DB_PATH);

// Create tables
console.log('Creating tables...');
testDb.exec(`
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
`);

// Copy sample foods (chicken-related)
console.log('Copying sample chicken foods...');
const foods = fullDb.prepare(`
  SELECT * FROM food
  WHERE description LIKE '%chicken%'
  LIMIT 100
`).all();

const insertFood = testDb.prepare(`
  INSERT INTO food (fdc_id, description, data_type, food_category_id)
  VALUES (?, ?, ?, ?)
`);

const insertMany = testDb.transaction((foods) => {
  for (const food of foods) {
    insertFood.run(food.fdc_id, food.description, food.data_type, food.food_category_id);
  }
});

insertMany(foods);
console.log(`  Copied ${foods.length} foods`);

// Copy branded food data
console.log('Copying branded food data...');
const fdcIds = foods.map(f => f.fdc_id);
const placeholders = fdcIds.map(() => '?').join(',');

const brandedFoods = fullDb.prepare(`
  SELECT * FROM branded_food
  WHERE fdc_id IN (${placeholders})
`).all(...fdcIds);

if (brandedFoods.length > 0) {
  const insertBranded = testDb.prepare(`
    INSERT INTO branded_food (fdc_id, upc, brand_name, ingredients)
    VALUES (?, ?, ?, ?)
  `);

  const insertBrandedMany = testDb.transaction((items) => {
    for (const item of items) {
      insertBranded.run(item.fdc_id, item.upc, item.brand_name, item.ingredients);
    }
  });

  insertBrandedMany(brandedFoods);
  console.log(`  Copied ${brandedFoods.length} branded foods`);
}

// Copy all nutrients
console.log('Copying nutrients...');
const nutrients = fullDb.prepare('SELECT * FROM nutrient').all();

const insertNutrient = testDb.prepare(`
  INSERT INTO nutrient (id, name, unit_name)
  VALUES (?, ?, ?)
`);

const insertNutrientsMany = testDb.transaction((nutrients) => {
  for (const nutrient of nutrients) {
    insertNutrient.run(nutrient.id, nutrient.name, nutrient.unit_name);
  }
});

insertNutrientsMany(nutrients);
console.log(`  Copied ${nutrients.length} nutrients`);

// Copy food nutrients
console.log('Copying food nutrients...');
const foodNutrients = fullDb.prepare(`
  SELECT * FROM food_nutrient
  WHERE fdc_id IN (${placeholders})
`).all(...fdcIds);

const insertFoodNutrient = testDb.prepare(`
  INSERT INTO food_nutrient (id, fdc_id, nutrient_id, amount)
  VALUES (?, ?, ?, ?)
`);

const insertFoodNutrientsMany = testDb.transaction((items) => {
  for (const item of items) {
    insertFoodNutrient.run(item.id, item.fdc_id, item.nutrient_id, item.amount);
  }
});

insertFoodNutrientsMany(foodNutrients);
console.log(`  Copied ${foodNutrients.length} food nutrient records`);

// Copy food portions
console.log('Copying food portions...');
const portions = fullDb.prepare(`
  SELECT * FROM food_portion
  WHERE fdc_id IN (${placeholders})
`).all(...fdcIds);

if (portions.length > 0) {
  const insertPortion = testDb.prepare(`
    INSERT INTO food_portion (id, fdc_id, portion_description, gram_weight)
    VALUES (?, ?, ?, ?)
  `);

  const insertPortionsMany = testDb.transaction((items) => {
    for (const item of items) {
      insertPortion.run(item.id, item.fdc_id, item.portion_description, item.gram_weight);
    }
  });

  insertPortionsMany(portions);
  console.log(`  Copied ${portions.length} portions`);
}

// Create indexes
console.log('Creating indexes...');
testDb.exec(`
  CREATE INDEX idx_food_description ON food(description);
  CREATE INDEX idx_branded_upc ON branded_food(upc);
  CREATE INDEX idx_foodnutrient_fdc ON food_nutrient(fdc_id);
  CREATE INDEX idx_foodnutrient_nutrient ON food_nutrient(nutrient_id);
  CREATE INDEX idx_foodportion_fdc ON food_portion(fdc_id);
`);

// Optimize
console.log('Optimizing...');
testDb.exec('VACUUM');
testDb.exec('ANALYZE');

fullDb.close();
testDb.close();

const fs = require('fs');
const stats = fs.statSync(TEST_DB_PATH);
const sizeMB = stats.size / (1024 * 1024);

console.log(`\n✓ Test database created: ${TEST_DB_PATH}`);
console.log(`  Size: ${sizeMB.toFixed(2)} MB`);
console.log(`  Foods: ${foods.length}`);
console.log(`  Nutrients: ${nutrients.length}`);
console.log('\nYou can now use usda-test.sqlite for faster testing!');
