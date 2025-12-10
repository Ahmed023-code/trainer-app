#!/usr/bin/env node
/**
 * Test Postgres API endpoints
 */

const { query } = require('../lib/usda-postgres.ts');

async function testConnection() {
  console.log('🧪 Testing Neon Postgres connection...\n');

  try {
    // Test 1: Count foods
    console.log('📊 Test 1: Count total foods');
    const foodCount = await query('SELECT COUNT(*) as count FROM foods');
    console.log(`   ✓ Total foods: ${parseInt(foodCount[0].count).toLocaleString()}\n`);

    // Test 2: Search for chicken
    console.log('🔍 Test 2: Search for "chicken"');
    const searchResults = await query(`
      SELECT f.fdc_id, f.description, f.data_type
      FROM foods f
      WHERE LOWER(f.description) LIKE $1
      LIMIT 5
    `, ['%chicken%']);
    console.log(`   ✓ Found ${searchResults.length} results:`);
    searchResults.forEach((food, i) => {
      console.log(`      ${i + 1}. [${food.fdc_id}] ${food.description}`);
    });
    console.log('');

    // Test 3: Get food details for first result
    if (searchResults.length > 0) {
      const fdcId = searchResults[0].fdc_id;
      console.log(`📋 Test 3: Get details for food ${fdcId}`);

      const nutrients = await query(`
        SELECT n.name, fn.amount, n.unit_name
        FROM food_nutrients fn
        JOIN nutrients n ON fn.nutrient_id = n.id
        WHERE fn.fdc_id = $1
        LIMIT 5
      `, [fdcId]);

      console.log(`   ✓ Found ${nutrients.length} nutrients (showing first 5):`);
      nutrients.forEach((nutrient, i) => {
        console.log(`      ${i + 1}. ${nutrient.name}: ${nutrient.amount} ${nutrient.unit_name}`);
      });
      console.log('');
    }

    console.log('✅ All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();
