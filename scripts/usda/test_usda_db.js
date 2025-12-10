#!/usr/bin/env node
/**
 * Test USDA Database - Example queries
 */

const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', '..', 'data', 'usda', 'usda.sqlite'), { readonly: true });

console.log('='.repeat(70));
console.log('USDA NUTRITION DATABASE - EXAMPLE QUERIES');
console.log('='.repeat(70));

// Test 1: Search for foods by name
console.log('\n1. SEARCH: "chicken breast"');
console.log('-'.repeat(70));
const chickenResults = db.prepare(`
  SELECT fdc_id, description, data_type
  FROM food
  WHERE description LIKE '%chicken breast%'
  LIMIT 5
`).all();

chickenResults.forEach(food => {
  console.log(`   [${food.fdc_id}] ${food.description} (${food.data_type})`);
});

// Test 2: Get complete nutrition for a specific food
console.log('\n2. COMPLETE NUTRITION: Chicken breast');
console.log('-'.repeat(70));
const foodId = chickenResults[0].fdc_id;
const nutrition = db.prepare(`
  SELECT n.name, fn.amount, n.unit_name
  FROM food_nutrient fn
  JOIN nutrient n ON fn.nutrient_id = n.id
  WHERE fn.fdc_id = ?
  ORDER BY n.name
`).all(foodId);

console.log(`   Food: ${chickenResults[0].description}`);
console.log(`   Total nutrients: ${nutrition.length}\n`);

// Show macros
const macros = ['Protein', 'Total lipid (fat)', 'Carbohydrate, by difference', 'Energy'];
console.log('   MACRONUTRIENTS:');
nutrition.filter(n => macros.some(m => n.name.includes(m))).forEach(n => {
  console.log(`     ${n.name}: ${n.amount} ${n.unit_name}`);
});

// Show vitamins
console.log('\n   VITAMINS (sample):');
nutrition.filter(n => n.name.includes('Vitamin')).slice(0, 5).forEach(n => {
  console.log(`     ${n.name}: ${n.amount} ${n.unit_name}`);
});

// Show minerals
console.log('\n   MINERALS (sample):');
nutrition.filter(n => ['Calcium', 'Iron', 'Sodium', 'Potassium', 'Zinc'].some(m => n.name.includes(m))).forEach(n => {
  console.log(`     ${n.name}: ${n.amount} ${n.unit_name}`);
});

// Test 3: Barcode lookup
console.log('\n3. BARCODE LOOKUP');
console.log('-'.repeat(70));
const brandedSample = db.prepare(`
  SELECT bf.fdc_id, bf.upc, bf.brand_name, f.description
  FROM branded_food bf
  JOIN food f ON bf.fdc_id = f.fdc_id
  WHERE bf.upc IS NOT NULL AND bf.upc != ''
  LIMIT 5
`).all();

console.log('   Sample UPC codes:');
brandedSample.forEach(item => {
  console.log(`   UPC: ${item.upc}`);
  console.log(`     Brand: ${item.brand_name || 'N/A'}`);
  console.log(`     Product: ${item.description}`);
  console.log();
});

// Test 4: Get portion sizes for a food
console.log('4. PORTION SIZES');
console.log('-'.repeat(70));
const portionFood = db.prepare(`
  SELECT f.fdc_id, f.description
  FROM food f
  JOIN food_portion fp ON f.fdc_id = fp.fdc_id
  WHERE fp.gram_weight IS NOT NULL
  LIMIT 1
`).get();

const portions = db.prepare(`
  SELECT portion_description, gram_weight
  FROM food_portion
  WHERE fdc_id = ? AND gram_weight IS NOT NULL
`).all(portionFood.fdc_id);

console.log(`   Food: ${portionFood.description}\n`);
console.log('   Available portions:');
portions.forEach(p => {
  console.log(`     ${p.portion_description}: ${p.gram_weight}g`);
});

// Test 5: Most common nutrients tracked
console.log('\n5. NUTRIENT DATABASE');
console.log('-'.repeat(70));
const commonNutrients = db.prepare(`
  SELECT n.id, n.name, n.unit_name, COUNT(fn.id) as food_count
  FROM nutrient n
  LEFT JOIN food_nutrient fn ON n.id = fn.nutrient_id
  GROUP BY n.id
  ORDER BY food_count DESC
  LIMIT 10
`).all();

console.log('   Top 10 most tracked nutrients:\n');
commonNutrients.forEach((n, i) => {
  console.log(`   ${i + 1}. ${n.name} (${n.unit_name}) - ${n.food_count.toLocaleString()} foods`);
});

// Test 6: Database statistics
console.log('\n6. DATABASE SUMMARY');
console.log('-'.repeat(70));

const stats = {
  totalFoods: db.prepare('SELECT COUNT(*) as count FROM food').get().count,
  brandedFoods: db.prepare('SELECT COUNT(*) as count FROM branded_food').get().count,
  totalNutrients: db.prepare('SELECT COUNT(*) as count FROM nutrient').get().count,
  nutritionRecords: db.prepare('SELECT COUNT(*) as count FROM food_nutrient').get().count,
  portionRecords: db.prepare('SELECT COUNT(*) as count FROM food_portion').get().count,
  foodsWithUPC: db.prepare("SELECT COUNT(*) as count FROM branded_food WHERE upc IS NOT NULL AND upc != ''").get().count
};

console.log(`   Total foods in database: ${stats.totalFoods.toLocaleString()}`);
console.log(`   Branded/commercial foods: ${stats.brandedFoods.toLocaleString()}`);
console.log(`   Foods with UPC/barcodes: ${stats.foodsWithUPC.toLocaleString()}`);
console.log(`   Total nutrients tracked: ${stats.totalNutrients.toLocaleString()}`);
console.log(`   Nutrition data points: ${stats.nutritionRecords.toLocaleString()}`);
console.log(`   Portion size records: ${stats.portionRecords.toLocaleString()}`);

console.log('\n' + '='.repeat(70));
console.log('✓ Database is ready for use in your app!');
console.log('='.repeat(70));

db.close();
