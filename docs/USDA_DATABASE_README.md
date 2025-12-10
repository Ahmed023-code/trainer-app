# USDA Nutrition Database

A complete, optimized SQLite database containing **2+ million foods** with full nutritional information from the USDA FoodData Central database.

## Database Information

- **File**: `usda.sqlite`
- **Size**: 2.1 GB
- **Format**: SQLite 3
- **Total Records**: ~31 million nutrition data points

## Database Contents

### Tables

#### 1. `food` (2,064,911 records)
Master table containing all foods.

```sql
CREATE TABLE food (
  fdc_id INTEGER PRIMARY KEY,      -- Unique food identifier
  description TEXT,                 -- Food name/description
  data_type TEXT,                   -- Type: branded_food, sr_legacy_food, etc.
  food_category_id INTEGER          -- Category reference
);
```

#### 2. `branded_food` (1,977,398 records)
Commercial/branded food products with UPC codes.

```sql
CREATE TABLE branded_food (
  fdc_id INTEGER PRIMARY KEY,
  upc TEXT,                         -- Barcode/UPC code
  brand_name TEXT,                  -- Brand manufacturer
  ingredients TEXT,                 -- Full ingredient list
  FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
);
```

#### 3. `nutrient` (477 records)
Complete list of all tracked nutrients.

```sql
CREATE TABLE nutrient (
  id INTEGER PRIMARY KEY,
  name TEXT,                        -- Nutrient name (e.g., "Protein", "Vitamin C")
  unit_name TEXT                    -- Unit (G, MG, UG, KCAL, etc.)
);
```

**Top tracked nutrients**:
- Energy (calories)
- Protein, Carbohydrates, Fats
- Fiber, Sugars
- Vitamins (A, B-complex, C, D, E, K)
- Minerals (Calcium, Iron, Sodium, Potassium, Zinc, etc.)
- Fatty acids (saturated, trans, monounsaturated, polyunsaturated)
- Cholesterol
- Amino acids

#### 4. `food_nutrient` (26,805,037 records)
**Main nutrition data** - maps foods to their nutrient values.

```sql
CREATE TABLE food_nutrient (
  id INTEGER PRIMARY KEY,
  fdc_id INTEGER,                   -- Food reference
  nutrient_id INTEGER,              -- Nutrient reference
  amount REAL,                      -- Nutrient amount
  FOREIGN KEY(fdc_id) REFERENCES food(fdc_id),
  FOREIGN KEY(nutrient_id) REFERENCES nutrient(id)
);
```

#### 5. `food_portion` (47,173 records)
Serving size definitions and conversions.

```sql
CREATE TABLE food_portion (
  id INTEGER PRIMARY KEY,
  fdc_id INTEGER,                   -- Food reference
  portion_description TEXT,         -- e.g., "1 cup", "1 tbsp"
  gram_weight REAL,                 -- Gram equivalent
  FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
);
```

## Performance Indexes

All queries are optimized with indexes on:
- `food.description` (for name searches)
- `branded_food.upc` (for barcode lookups)
- `food_nutrient.fdc_id` (for food → nutrients)
- `food_nutrient.nutrient_id` (for nutrient → foods)
- `food_portion.fdc_id` (for portion lookups)

## Usage Examples

### 1. Search for Foods by Name

```javascript
const db = require('better-sqlite3')('usda.sqlite');

const results = db.prepare(`
  SELECT fdc_id, description, data_type
  FROM food
  WHERE description LIKE ?
  LIMIT 10
`).all('%chicken breast%');

console.log(results);
// [
//   { fdc_id: 171514, description: 'Chicken breast tenders...', data_type: 'sr_legacy_food' }
// ]
```

### 2. Get Complete Nutrition for a Food

```javascript
const nutrition = db.prepare(`
  SELECT n.name, fn.amount, n.unit_name
  FROM food_nutrient fn
  JOIN nutrient n ON fn.nutrient_id = n.id
  WHERE fn.fdc_id = ?
`).all(171514);

console.log(nutrition);
// [
//   { name: 'Energy', amount: 252, unit_name: 'KCAL' },
//   { name: 'Protein', amount: 16.35, unit_name: 'G' },
//   { name: 'Total lipid (fat)', amount: 12.89, unit_name: 'G' },
//   ...
// ]
```

### 3. Lookup Food by Barcode/UPC

```javascript
const product = db.prepare(`
  SELECT f.fdc_id, f.description, bf.brand_name, bf.ingredients
  FROM branded_food bf
  JOIN food f ON bf.fdc_id = f.fdc_id
  WHERE bf.upc = ?
`).get('00072940755050');

console.log(product);
// {
//   fdc_id: 344604,
//   description: 'Tutturosso Green 14.5oz. NSA Italian Diced Tomatoes',
//   brand_name: 'Tutturosso',
//   ingredients: 'TOMATOES, TOMATO JUICE...'
// }
```

### 4. Get Macros Only (Fast Query)

```javascript
const macros = db.prepare(`
  SELECT n.name, fn.amount, n.unit_name
  FROM food_nutrient fn
  JOIN nutrient n ON fn.nutrient_id = n.id
  WHERE fn.fdc_id = ?
  AND n.name IN ('Energy', 'Protein', 'Total lipid (fat)', 'Carbohydrate, by difference')
`).all(171514);

console.log(macros);
// [
//   { name: 'Energy', amount: 252, unit_name: 'KCAL' },
//   { name: 'Protein', amount: 16.35, unit_name: 'G' },
//   { name: 'Total lipid (fat)', amount: 12.89, unit_name: 'G' },
//   { name: 'Carbohydrate, by difference', amount: 17.56, unit_name: 'G' }
// ]
```

### 5. Get Portion Sizes

```javascript
const portions = db.prepare(`
  SELECT portion_description, gram_weight
  FROM food_portion
  WHERE fdc_id = ?
`).all(171514);

console.log(portions);
// [
//   { portion_description: '1 cup', gram_weight: 240 },
//   { portion_description: '100g', gram_weight: 100 }
// ]
```

### 6. Search with Nutrient Filtering

```javascript
// Find high-protein foods
const highProtein = db.prepare(`
  SELECT f.description, fn.amount as protein
  FROM food f
  JOIN food_nutrient fn ON f.fdc_id = fn.fdc_id
  JOIN nutrient n ON fn.nutrient_id = n.id
  WHERE n.name = 'Protein'
  AND fn.amount > 20
  ORDER BY fn.amount DESC
  LIMIT 10
`).all();

console.log(highProtein);
```

## Common Nutrient IDs

For faster queries, you can hardcode common nutrient IDs:

| Nutrient | ID | Unit |
|----------|-----|------|
| Energy (Calories) | 1008 | KCAL |
| Protein | 1003 | G |
| Total Fat | 1004 | G |
| Carbohydrates | 1005 | G |
| Fiber | 1079 | G |
| Sugars | 2000 | G |
| Calcium | 1087 | MG |
| Iron | 1089 | MG |
| Sodium | 1093 | MG |
| Vitamin C | 1162 | MG |
| Vitamin A | 1106 | IU |

Query by ID:
```javascript
const calories = db.prepare(`
  SELECT amount
  FROM food_nutrient
  WHERE fdc_id = ? AND nutrient_id = 1008
`).get(171514);
```

## Integration with Your App

### React Native Example

```javascript
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'usda.sqlite' });

const searchFood = (query) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM food WHERE description LIKE ? LIMIT 20',
        [`%${query}%`],
        (tx, results) => {
          const items = [];
          for (let i = 0; i < results.rows.length; i++) {
            items.push(results.rows.item(i));
          }
          resolve(items);
        },
        (tx, error) => reject(error)
      );
    });
  });
};
```

### Expo SQLite Example

```javascript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('usda.sqlite');

const getNutrition = (fdcId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT n.name, fn.amount, n.unit_name
         FROM food_nutrient fn
         JOIN nutrient n ON fn.nutrient_id = n.id
         WHERE fn.fdc_id = ?`,
        [fdcId],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};
```

## Features Supported

✅ **Food Search** - Search 2M+ foods by name
✅ **Barcode Scanning** - Lookup by UPC code
✅ **Complete Nutrition** - 477 nutrients tracked
✅ **Macros & Micros** - Calories, protein, vitamins, minerals
✅ **Portion Sizes** - Serving size conversions
✅ **Ingredients** - Full ingredient lists for branded foods
✅ **Offline Access** - No internet required
✅ **Fast Queries** - Optimized indexes for performance

## Data Types

The `data_type` field in the `food` table indicates the source:

- `branded_food` - Commercial products (1.98M records)
- `sr_legacy_food` - USDA Standard Reference (~8,000 records)
- `foundation_food` - Foundation foods (~500 records)
- `survey_fndds_food` - Survey foods (~5,000 records)

## Maintenance

### Rebuilding the Database

To rebuild from scratch:

```bash
node build_usda_db.js
```

This will:
1. Drop and recreate all tables
2. Import all CSV files from `USDA/FOODS/`
3. Create indexes
4. Optimize the database
5. Run verification tests

### Testing the Database

```bash
node test_usda_db.js
```

## Database Statistics

- **Total foods**: 2,064,911
- **Branded foods**: 1,977,398
- **Foods with barcodes**: 1,977,398
- **Nutrients tracked**: 477
- **Nutrition data points**: 26,805,037
- **Portion size records**: 47,173
- **Database size**: 2.1 GB

## Source Data

Original data from: **USDA FoodData Central**
- Website: https://fdc.nal.usda.gov/
- Data License: Public Domain
- Format: CSV exports from FDC database

## Notes

1. **Null values**: Some foods may not have all nutrients measured. Check for `NULL` values.
2. **Portion descriptions**: Some portions may have `null` descriptions but valid gram weights.
3. **Brand names**: Not all branded foods have brand names populated.
4. **Energy values**: Calories are stored in both KCAL (1008) and kJ (1062) formats.
5. **Performance**: For mobile apps, consider creating a smaller subset database with only commonly used nutrients.

## Query Performance Tips

1. **Always use indexes** - The database is indexed for description, UPC, and fdc_id lookups
2. **Limit results** - Use `LIMIT` for search queries
3. **Cache common queries** - Cache nutrient IDs and frequently accessed foods
4. **Use transactions** - Wrap multiple queries in transactions for better performance
5. **Prepare statements** - Use prepared statements for repeated queries

## License

The USDA FoodData Central database is in the **public domain** and can be used freely in commercial and non-commercial applications.

---

**Built on**: 2025-11-05
**USDA FDC Version**: Latest export
**Database Format**: SQLite 3
**Optimized for**: Mobile and web applications
