#!/usr/bin/env node
/**
 * Analyze database categories and sizes
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../public/db/usda-full.sqlite');

function analyzeCategories() {
  console.log('📊 Analyzing database categories and sizes...\n');

  const db = new Database(DB_PATH, { readonly: true });

  try {
    // Get overall stats
    console.log('='.repeat(70));
    console.log('OVERALL DATABASE STATS');
    console.log('='.repeat(70));

    const totalFoods = db.prepare('SELECT COUNT(*) as count FROM foods').get();
    console.log(`Total foods: ${totalFoods.count.toLocaleString()}`);

    const totalNutrients = db.prepare('SELECT COUNT(*) as count FROM food_nutrients').get();
    console.log(`Total nutrient records: ${totalNutrients.count.toLocaleString()}`);

    const totalPortions = db.prepare('SELECT COUNT(*) as count FROM food_portions').get();
    console.log(`Total portion records: ${totalPortions.count.toLocaleString()}`);

    // Breakdown by data type
    console.log('\n' + '='.repeat(70));
    console.log('FOODS BY DATA TYPE');
    console.log('='.repeat(70));

    const foodsByType = db.prepare(`
      SELECT
        data_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / ?, 2) as percentage
      FROM foods
      GROUP BY data_type
      ORDER BY count DESC
    `).all(totalFoods.count);

    foodsByType.forEach(row => {
      console.log(`${row.data_type.padEnd(25)} ${row.count.toLocaleString().padStart(12)} (${row.percentage}%)`);
    });

    // Breakdown by branded food category
    console.log('\n' + '='.repeat(70));
    console.log('TOP 50 BRANDED FOOD CATEGORIES');
    console.log('='.repeat(70));

    const brandedCategories = db.prepare(`
      SELECT
        branded_food_category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM branded_foods), 2) as percentage
      FROM branded_foods
      WHERE branded_food_category != ''
      GROUP BY branded_food_category
      ORDER BY count DESC
      LIMIT 50
    `).all();

    console.log('Category'.padEnd(50) + 'Count'.padStart(12) + '  %'.padStart(8));
    console.log('-'.repeat(70));

    brandedCategories.forEach(row => {
      const category = row.branded_food_category.length > 47
        ? row.branded_food_category.substring(0, 47) + '...'
        : row.branded_food_category;
      console.log(
        `${category.padEnd(50)} ${row.count.toLocaleString().padStart(12)}  ${row.percentage.toString().padStart(6)}%`
      );
    });

    // Estimate sizes
    console.log('\n' + '='.repeat(70));
    console.log('SIZE ESTIMATES BY DATA TYPE');
    console.log('='.repeat(70));

    // Get a sample of rows to estimate average row size
    const sampleFoods = db.prepare('SELECT * FROM foods LIMIT 1000').all();
    const sampleBranded = db.prepare('SELECT * FROM branded_foods LIMIT 1000').all();
    const sampleNutrients = db.prepare('SELECT * FROM food_nutrients LIMIT 1000').all();
    const samplePortions = db.prepare('SELECT * FROM food_portions LIMIT 1000').all();

    // Rough estimate: JSON stringify to get byte size
    const avgFoodSize = JSON.stringify(sampleFoods).length / sampleFoods.length;
    const avgBrandedSize = JSON.stringify(sampleBranded).length / sampleBranded.length;
    const avgNutrientSize = JSON.stringify(sampleNutrients).length / sampleNutrients.length;
    const avgPortionSize = JSON.stringify(samplePortions).length / samplePortions.length;

    const totalFoodsSize = (totalFoods.count * avgFoodSize) / (1024 * 1024);
    const totalBrandedCount = db.prepare('SELECT COUNT(*) as count FROM branded_foods').get().count;
    const totalBrandedSize = (totalBrandedCount * avgBrandedSize) / (1024 * 1024);
    const totalNutrientsSize = (totalNutrients.count * avgNutrientSize) / (1024 * 1024);
    const totalPortionsSize = (totalPortions.count * avgPortionSize) / (1024 * 1024);

    console.log(`Foods table:         ~${totalFoodsSize.toFixed(2)} MB`);
    console.log(`Branded foods table: ~${totalBrandedSize.toFixed(2)} MB`);
    console.log(`Food nutrients:      ~${totalNutrientsSize.toFixed(2)} MB`);
    console.log(`Food portions:       ~${totalPortionsSize.toFixed(2)} MB`);
    console.log(`Total (estimated):   ~${(totalFoodsSize + totalBrandedSize + totalNutrientsSize + totalPortionsSize).toFixed(2)} MB`);

    // SR Legacy, Foundation, Survey breakdown
    console.log('\n' + '='.repeat(70));
    console.log('CORE FOODS (Non-Branded)');
    console.log('='.repeat(70));

    const coreFoods = db.prepare(`
      SELECT
        data_type,
        COUNT(*) as count
      FROM foods
      WHERE data_type IN ('sr_legacy_food', 'foundation_food', 'survey_fndds_food')
      GROUP BY data_type
      ORDER BY count DESC
    `).all();

    let totalCore = 0;
    coreFoods.forEach(row => {
      console.log(`${row.data_type.padEnd(25)} ${row.count.toLocaleString().padStart(12)}`);
      totalCore += row.count;
    });
    console.log('-'.repeat(70));
    console.log(`${'Total Core Foods'.padEnd(25)} ${totalCore.toLocaleString().padStart(12)}`);

    const coreNutrients = db.prepare(`
      SELECT COUNT(*) as count
      FROM food_nutrients fn
      JOIN foods f ON fn.fdc_id = f.fdc_id
      WHERE f.data_type IN ('sr_legacy_food', 'foundation_food', 'survey_fndds_food')
    `).get();

    const corePortions = db.prepare(`
      SELECT COUNT(*) as count
      FROM food_portions fp
      JOIN foods f ON fp.fdc_id = f.fdc_id
      WHERE f.data_type IN ('sr_legacy_food', 'foundation_food', 'survey_fndds_food')
    `).get();

    const estimatedCoreSize = (
      (totalCore * avgFoodSize) +
      (coreNutrients.count * avgNutrientSize) +
      (corePortions.count * avgPortionSize)
    ) / (1024 * 1024);

    console.log(`\nCore nutrient records: ${coreNutrients.count.toLocaleString()}`);
    console.log(`Core portion records:  ${corePortions.count.toLocaleString()}`);
    console.log(`\nEstimated core DB size: ~${estimatedCoreSize.toFixed(2)} MB`);

    // Branded foods breakdown
    console.log('\n' + '='.repeat(70));
    console.log('BRANDED FOODS');
    console.log('='.repeat(70));

    const brandedFoods = db.prepare(`
      SELECT COUNT(*) as count FROM foods WHERE data_type = 'branded_food'
    `).get();

    const brandedNutrients = db.prepare(`
      SELECT COUNT(*) as count
      FROM food_nutrients fn
      JOIN foods f ON fn.fdc_id = f.fdc_id
      WHERE f.data_type = 'branded_food'
    `).get();

    const brandedPortions = db.prepare(`
      SELECT COUNT(*) as count
      FROM food_portions fp
      JOIN foods f ON fp.fdc_id = f.fdc_id
      WHERE f.data_type = 'branded_food'
    `).get();

    const estimatedBrandedSize = (
      (brandedFoods.count * avgFoodSize) +
      (totalBrandedCount * avgBrandedSize) +
      (brandedNutrients.count * avgNutrientSize) +
      (brandedPortions.count * avgPortionSize)
    ) / (1024 * 1024);

    console.log(`Total branded foods:    ${brandedFoods.count.toLocaleString()}`);
    console.log(`Branded nutrient records: ${brandedNutrients.count.toLocaleString()}`);
    console.log(`Branded portion records:  ${brandedPortions.count.toLocaleString()}`);
    console.log(`\nEstimated branded DB size: ~${estimatedBrandedSize.toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

analyzeCategories();
