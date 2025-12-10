#!/usr/bin/env node
/**
 * Check for duplicate records in the USDA database
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../public/db/usda-full.sqlite');

function checkDuplicates() {
  console.log('🔍 Checking for duplicates in USDA database...\n');

  const db = new Database(DB_PATH, { readonly: true });

  try {
    // Check for duplicate foods (same fdc_id)
    console.log('📋 Checking foods table...');
    const duplicateFoods = db.prepare(`
      SELECT fdc_id, COUNT(*) as count
      FROM foods
      GROUP BY fdc_id
      HAVING count > 1
    `).all();

    if (duplicateFoods.length > 0) {
      console.log(`  ⚠️  Found ${duplicateFoods.length} duplicate fdc_ids in foods table`);
      console.log(`  Sample:`, duplicateFoods.slice(0, 5));
    } else {
      console.log('  ✓ No duplicate fdc_ids in foods table');
    }

    // Check for duplicate food descriptions (exact matches)
    console.log('\n📋 Checking for duplicate food descriptions...');
    const duplicateDescriptions = db.prepare(`
      SELECT description, COUNT(*) as count, GROUP_CONCAT(fdc_id) as fdc_ids
      FROM foods
      GROUP BY description
      HAVING count > 1
      ORDER BY count DESC
      LIMIT 10
    `).all();

    if (duplicateDescriptions.length > 0) {
      console.log(`  ⚠️  Found ${duplicateDescriptions.length}+ foods with duplicate descriptions`);
      console.log('  Top duplicates:');
      duplicateDescriptions.forEach(d => {
        console.log(`    - "${d.description}" (${d.count} times, fdc_ids: ${d.fdc_ids.split(',').slice(0, 3).join(', ')}...)`);
      });
    } else {
      console.log('  ✓ No duplicate descriptions found');
    }

    // Check for duplicate branded foods
    console.log('\n📋 Checking branded_foods table...');
    const duplicateBranded = db.prepare(`
      SELECT fdc_id, COUNT(*) as count
      FROM branded_foods
      GROUP BY fdc_id
      HAVING count > 1
    `).all();

    if (duplicateBranded.length > 0) {
      console.log(`  ⚠️  Found ${duplicateBranded.length} duplicate fdc_ids in branded_foods`);
    } else {
      console.log('  ✓ No duplicate fdc_ids in branded_foods');
    }

    // Check for duplicate GTIN/UPC codes
    console.log('\n📋 Checking for duplicate GTIN/UPC codes...');
    const duplicateGtin = db.prepare(`
      SELECT gtin_upc, COUNT(*) as count, GROUP_CONCAT(fdc_id) as fdc_ids
      FROM branded_foods
      WHERE gtin_upc != ''
      GROUP BY gtin_upc
      HAVING count > 1
      ORDER BY count DESC
      LIMIT 10
    `).all();

    if (duplicateGtin.length > 0) {
      console.log(`  ⚠️  Found ${duplicateGtin.length}+ duplicate GTIN/UPC codes`);
      console.log('  Top duplicates:');
      duplicateGtin.forEach(d => {
        const fdcIds = d.fdc_ids.split(',');
        console.log(`    - GTIN: ${d.gtin_upc} (${d.count} products)`);

        // Get details of first few products
        const products = db.prepare(`
          SELECT bf.fdc_id, f.description, bf.brand_owner
          FROM branded_foods bf
          JOIN foods f ON bf.fdc_id = f.fdc_id
          WHERE bf.gtin_upc = ?
          LIMIT 3
        `).all(d.gtin_upc);

        products.forEach(p => {
          console.log(`      - [${p.fdc_id}] ${p.description} (${p.brand_owner})`);
        });
      });
    } else {
      console.log('  ✓ No duplicate GTIN/UPC codes found');
    }

    // Check for duplicate nutrients
    console.log('\n📋 Checking nutrients table...');
    const duplicateNutrients = db.prepare(`
      SELECT id, COUNT(*) as count
      FROM nutrients
      GROUP BY id
      HAVING count > 1
    `).all();

    if (duplicateNutrients.length > 0) {
      console.log(`  ⚠️  Found ${duplicateNutrients.length} duplicate nutrient ids`);
    } else {
      console.log('  ✓ No duplicate nutrient ids');
    }

    // Check for duplicate food_nutrient records (same food + nutrient combo)
    console.log('\n📋 Checking food_nutrients table for duplicate combinations...');
    const duplicateFoodNutrients = db.prepare(`
      SELECT fdc_id, nutrient_id, COUNT(*) as count
      FROM food_nutrients
      GROUP BY fdc_id, nutrient_id
      HAVING count > 1
      LIMIT 10
    `).all();

    if (duplicateFoodNutrients.length > 0) {
      console.log(`  ⚠️  Found ${duplicateFoodNutrients.length}+ duplicate food-nutrient combinations`);
      console.log('  Sample:', duplicateFoodNutrients.slice(0, 5));
    } else {
      console.log('  ✓ No duplicate food-nutrient combinations');
    }

    // Check for duplicate food_portions
    console.log('\n📋 Checking food_portions table...');
    const duplicatePortions = db.prepare(`
      SELECT id, COUNT(*) as count
      FROM food_portions
      GROUP BY id
      HAVING count > 1
    `).all();

    if (duplicatePortions.length > 0) {
      console.log(`  ⚠️  Found ${duplicatePortions.length} duplicate portion ids`);
    } else {
      console.log('  ✓ No duplicate portion ids');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log('='.repeat(50));

    const totalDuplicates =
      duplicateFoods.length +
      duplicateBranded.length +
      duplicateNutrients.length +
      duplicatePortions.length +
      duplicateFoodNutrients.length;

    if (totalDuplicates === 0) {
      console.log('✅ No primary key duplicates found!');
    } else {
      console.log(`⚠️  Found duplicates in ${totalDuplicates} places`);
    }

    if (duplicateDescriptions.length > 0) {
      console.log(`ℹ️  ${duplicateDescriptions.length}+ foods share descriptions (not necessarily duplicates)`);
    }

    if (duplicateGtin.length > 0) {
      console.log(`ℹ️  ${duplicateGtin.length}+ GTIN/UPC codes are shared (product variations)`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

checkDuplicates();
