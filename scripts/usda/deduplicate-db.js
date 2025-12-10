#!/usr/bin/env node
/**
 * USDA Database Deduplication Script
 * Removes exact duplicates (same description + brand_name)
 * Keeps the entry with the most complete nutrition data
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'usda', 'usda.sqlite');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'data', 'usda', 'usda-deduplicated.sqlite');

console.log('='.repeat(60));
console.log('USDA DATABASE DEDUPLICATION');
console.log('='.repeat(60) + '\n');

// Copy database to new file
console.log('Creating deduplicated database copy...');
if (fs.existsSync(OUTPUT_PATH)) {
  fs.unlinkSync(OUTPUT_PATH);
}
fs.copyFileSync(DB_PATH, OUTPUT_PATH);
console.log('✓ Database copied\n');

const db = new Database(OUTPUT_PATH);
db.pragma('journal_mode = WAL');

try {
  console.log('Analyzing duplicates...\n');

  // Get statistics before deduplication
  const beforeStats = {
    foods: db.prepare('SELECT COUNT(*) as count FROM food').get().count,
    branded: db.prepare('SELECT COUNT(*) as count FROM branded_food').get().count,
    nutrients: db.prepare('SELECT COUNT(*) as count FROM food_nutrient').get().count,
    portions: db.prepare('SELECT COUNT(*) as count FROM food_portion').get().count
  };

  console.log('Before deduplication:');
  console.log(`  Foods: ${beforeStats.foods.toLocaleString()}`);
  console.log(`  Branded foods: ${beforeStats.branded.toLocaleString()}`);
  console.log(`  Nutrient records: ${beforeStats.nutrients.toLocaleString()}`);
  console.log(`  Portion records: ${beforeStats.portions.toLocaleString()}\n`);

  // Find duplicate groups (same description + brand_name)
  console.log('Finding duplicate groups...');
  const duplicateGroups = db.prepare(`
    SELECT f.description, b.brand_name, GROUP_CONCAT(f.fdc_id) as fdc_ids
    FROM food f
    JOIN branded_food b ON f.fdc_id = b.fdc_id
    GROUP BY f.description, b.brand_name
    HAVING COUNT(*) > 1
  `).all();

  console.log(`✓ Found ${duplicateGroups.length.toLocaleString()} duplicate groups\n`);

  // For each duplicate group, keep the one with most nutrition data
  console.log('Removing duplicates (keeping best entry per group)...\n');

  let removedCount = 0;
  let processedGroups = 0;

  db.transaction(() => {
    for (const group of duplicateGroups) {
      const fdcIds = group.fdc_ids.split(',').map(id => parseInt(id));

      // Count nutrition data for each food in the group
      const foodScores = fdcIds.map(fdcId => {
        const nutrientCount = db.prepare(
          'SELECT COUNT(*) as count FROM food_nutrient WHERE fdc_id = ?'
        ).get(fdcId).count;

        const portionCount = db.prepare(
          'SELECT COUNT(*) as count FROM food_portion WHERE fdc_id = ?'
        ).get(fdcId).count;

        return {
          fdc_id: fdcId,
          score: nutrientCount + (portionCount * 2) // Portions are more valuable
        };
      });

      // Sort by score (highest first)
      foodScores.sort((a, b) => b.score - a.score);

      // Keep the first (best), remove the rest
      const toKeep = foodScores[0].fdc_id;
      const toRemove = foodScores.slice(1).map(f => f.fdc_id);

      // Delete from all tables
      for (const fdcId of toRemove) {
        db.prepare('DELETE FROM food_portion WHERE fdc_id = ?').run(fdcId);
        db.prepare('DELETE FROM food_nutrient WHERE fdc_id = ?').run(fdcId);
        db.prepare('DELETE FROM branded_food WHERE fdc_id = ?').run(fdcId);
        db.prepare('DELETE FROM food WHERE fdc_id = ?').run(fdcId);
        removedCount++;
      }

      processedGroups++;
      if (processedGroups % 1000 === 0) {
        process.stdout.write(`  Processed ${processedGroups.toLocaleString()} groups (removed ${removedCount.toLocaleString()} duplicates)...\r`);
      }
    }
  })();

  console.log(`✓ Processed ${processedGroups.toLocaleString()} groups (removed ${removedCount.toLocaleString()} duplicates)     \n`);

  // Get statistics after deduplication
  const afterStats = {
    foods: db.prepare('SELECT COUNT(*) as count FROM food').get().count,
    branded: db.prepare('SELECT COUNT(*) as count FROM branded_food').get().count,
    nutrients: db.prepare('SELECT COUNT(*) as count FROM food_nutrient').get().count,
    portions: db.prepare('SELECT COUNT(*) as count FROM food_portion').get().count
  };

  console.log('\nAfter deduplication:');
  console.log(`  Foods: ${afterStats.foods.toLocaleString()}`);
  console.log(`  Branded foods: ${afterStats.branded.toLocaleString()}`);
  console.log(`  Nutrient records: ${afterStats.nutrients.toLocaleString()}`);
  console.log(`  Portion records: ${afterStats.portions.toLocaleString()}\n`);

  // Optimize database
  console.log('Optimizing database...');
  db.exec('VACUUM');
  db.exec('ANALYZE');
  console.log('✓ Database optimized\n');

  // Get file sizes
  const originalSize = fs.statSync(DB_PATH).size;
  const newSize = fs.statSync(OUTPUT_PATH).size;
  const originalMB = (originalSize / (1024 * 1024)).toFixed(2);
  const newMB = (newSize / (1024 * 1024)).toFixed(2);
  const savedMB = ((originalSize - newSize) / (1024 * 1024)).toFixed(2);
  const percentReduction = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

  console.log('Database size:');
  console.log(`  Original: ${originalMB} MB`);
  console.log(`  Deduplicated: ${newMB} MB`);
  console.log(`  Saved: ${savedMB} MB (${percentReduction}% reduction)\n`);

  console.log('='.repeat(60));
  console.log('✓ DEDUPLICATION COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`\nOutput: ${OUTPUT_PATH}\n`);

} catch (err) {
  console.error(`\n✗ Error: ${err.message}`);
  throw err;
} finally {
  db.close();
}
