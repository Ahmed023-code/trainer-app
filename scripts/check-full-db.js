#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../public/db/usda-full.sqlite'), { readonly: true });

const foodCount = db.prepare('SELECT COUNT(*) as count FROM foods').get();
const nutrientCount = db.prepare('SELECT COUNT(*) as count FROM food_nutrients').get();
const brandedCount = db.prepare('SELECT COUNT(*) as count FROM branded_foods').get();

console.log('Full Database Stats:');
console.log(`  Foods: ${foodCount.count.toLocaleString()}`);
console.log(`  Branded Foods: ${brandedCount.count.toLocaleString()}`);
console.log(`  Nutrient Records: ${nutrientCount.count.toLocaleString()}`);

db.close();
