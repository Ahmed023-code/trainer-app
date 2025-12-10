-- ============================================================
-- USDA Nutrition Database - Quick Start Queries
-- ============================================================

-- ============================================================
-- 1. BASIC FOOD SEARCH
-- ============================================================

-- Search by name (case-insensitive)
SELECT fdc_id, description, data_type
FROM food
WHERE description LIKE '%chicken%'
LIMIT 20;

-- Search with specific data type (branded foods only)
SELECT fdc_id, description
FROM food
WHERE description LIKE '%protein bar%'
AND data_type = 'branded_food'
LIMIT 20;


-- ============================================================
-- 2. BARCODE LOOKUP
-- ============================================================

-- Find food by UPC/barcode
SELECT
  f.fdc_id,
  f.description,
  bf.brand_name,
  bf.ingredients
FROM branded_food bf
JOIN food f ON bf.fdc_id = f.fdc_id
WHERE bf.upc = '00072940755050';


-- ============================================================
-- 3. GET COMPLETE NUTRITION (ALL NUTRIENTS)
-- ============================================================

-- Get all nutrients for a specific food
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
ORDER BY n.name;


-- ============================================================
-- 4. GET MACROS ONLY (FAST)
-- ============================================================

-- Get just calories, protein, carbs, and fat
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
AND n.name IN (
  'Energy',
  'Protein',
  'Total lipid (fat)',
  'Carbohydrate, by difference'
);


-- ============================================================
-- 5. GET SPECIFIC NUTRIENTS BY ID (FASTEST)
-- ============================================================

-- Ultra-fast macro lookup using nutrient IDs
SELECT
  nutrient_id,
  amount
FROM food_nutrient
WHERE fdc_id = 171514
AND nutrient_id IN (
  1008,  -- Energy (KCAL)
  1003,  -- Protein
  1004,  -- Total Fat
  1005   -- Carbohydrates
);


-- ============================================================
-- 6. PORTION SIZES
-- ============================================================

-- Get serving sizes for a food
SELECT
  portion_description,
  gram_weight
FROM food_portion
WHERE fdc_id = 171514
AND gram_weight IS NOT NULL;


-- ============================================================
-- 7. SEARCH WITH NUTRITION FILTERS
-- ============================================================

-- Find high-protein foods (>20g protein per 100g)
SELECT
  f.fdc_id,
  f.description,
  fn.amount as protein_g
FROM food f
JOIN food_nutrient fn ON f.fdc_id = fn.fdc_id
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE n.name = 'Protein'
AND fn.amount > 20
ORDER BY fn.amount DESC
LIMIT 20;


-- Find low-calorie foods (<100 kcal)
SELECT
  f.fdc_id,
  f.description,
  fn.amount as calories
FROM food f
JOIN food_nutrient fn ON f.fdc_id = fn.fdc_id
WHERE fn.nutrient_id = 1008  -- Energy (KCAL)
AND fn.amount < 100
ORDER BY fn.amount ASC
LIMIT 20;


-- ============================================================
-- 8. GET FOOD WITH COMPLETE INFO
-- ============================================================

-- Get food details + brand + ingredients
SELECT
  f.fdc_id,
  f.description,
  f.data_type,
  bf.brand_name,
  bf.upc,
  bf.ingredients
FROM food f
LEFT JOIN branded_food bf ON f.fdc_id = bf.fdc_id
WHERE f.fdc_id = 171514;


-- ============================================================
-- 9. VITAMINS AND MINERALS
-- ============================================================

-- Get all vitamins for a food
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
AND n.name LIKE '%Vitamin%'
ORDER BY n.name;


-- Get common minerals
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
AND n.name IN (
  'Calcium, Ca',
  'Iron, Fe',
  'Sodium, Na',
  'Potassium, K',
  'Zinc, Zn',
  'Magnesium, Mg'
);


-- ============================================================
-- 10. SEARCH BRANDED PRODUCTS
-- ============================================================

-- Search branded products by brand name
SELECT
  f.fdc_id,
  f.description,
  bf.brand_name
FROM food f
JOIN branded_food bf ON f.fdc_id = bf.fdc_id
WHERE bf.brand_name LIKE '%Kraft%'
LIMIT 20;


-- ============================================================
-- 11. FIBER AND SUGAR INFO
-- ============================================================

-- Get fiber and sugar content
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
AND n.name IN (
  'Fiber, total dietary',
  'Total Sugars',
  'Sugars, added'
);


-- ============================================================
-- 12. FATTY ACID BREAKDOWN
-- ============================================================

-- Get detailed fat information
SELECT
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514
AND (
  n.name LIKE '%Fatty acids%'
  OR n.name = 'Cholesterol'
  OR n.name = 'Total lipid (fat)'
)
ORDER BY n.name;


-- ============================================================
-- 13. AUTOCOMPLETE SEARCH
-- ============================================================

-- Fast autocomplete for food search
SELECT
  fdc_id,
  description,
  data_type
FROM food
WHERE description LIKE 'chick%'  -- Starts with 'chick'
LIMIT 10;


-- ============================================================
-- 14. RECENTLY ADDED FOODS
-- ============================================================

-- Note: This requires the publication_date field
-- Get recently added foods (if date field exists)
SELECT
  fdc_id,
  description,
  data_type
FROM food
ORDER BY fdc_id DESC
LIMIT 20;


-- ============================================================
-- 15. NUTRIENT REFERENCE LIST
-- ============================================================

-- Get all available nutrients with IDs
SELECT
  id,
  name,
  unit_name
FROM nutrient
ORDER BY name;


-- Get most commonly tracked nutrients
SELECT
  n.id,
  n.name,
  n.unit_name,
  COUNT(fn.id) as food_count
FROM nutrient n
LEFT JOIN food_nutrient fn ON n.id = fn.nutrient_id
GROUP BY n.id
ORDER BY food_count DESC
LIMIT 20;


-- ============================================================
-- 16. BULK NUTRITION LOOKUP
-- ============================================================

-- Get nutrition for multiple foods at once
SELECT
  fn.fdc_id,
  n.name,
  fn.amount,
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id IN (171514, 171515, 172945)
AND n.name IN ('Energy', 'Protein', 'Total lipid (fat)', 'Carbohydrate, by difference');


-- ============================================================
-- 17. CALCULATE PORTION NUTRITION
-- ============================================================

-- Calculate nutrition for a specific portion
-- Example: 200g of a food (where 100g has known values)
SELECT
  n.name,
  (fn.amount * 2.0) as amount_per_200g,  -- Multiply by 2 for 200g
  n.unit_name
FROM food_nutrient fn
JOIN nutrient n ON fn.nutrient_id = n.id
WHERE fn.fdc_id = 171514;


-- ============================================================
-- 18. INGREDIENT SEARCH
-- ============================================================

-- Search by ingredients
SELECT
  f.fdc_id,
  f.description,
  bf.brand_name,
  bf.ingredients
FROM food f
JOIN branded_food bf ON f.fdc_id = bf.fdc_id
WHERE bf.ingredients LIKE '%organic%'
LIMIT 20;


-- ============================================================
-- COMMON NUTRIENT IDS (for fastest queries)
-- ============================================================

/*
1008 - Energy (KCAL)
1003 - Protein (G)
1004 - Total lipid (fat) (G)
1005 - Carbohydrate, by difference (G)
1079 - Fiber, total dietary (G)
2000 - Total Sugars (G)
1087 - Calcium, Ca (MG)
1089 - Iron, Fe (MG)
1093 - Sodium, Na (MG)
1092 - Potassium, K (MG)
1162 - Vitamin C, total ascorbic acid (MG)
1104 - Vitamin A, IU (IU)
1114 - Vitamin D (D2 + D3) (UG)
1109 - Vitamin E (alpha-tocopherol) (MG)
1183 - Vitamin K (phylloquinone) (UG)
*/


-- ============================================================
-- PERFORMANCE TIPS
-- ============================================================

/*
1. Always use LIMIT for search queries
2. Use nutrient_id instead of name when possible
3. Use prepared statements for repeated queries
4. Create indexes on frequently queried columns
5. Cache common nutrient IDs in your app
6. Use LEFT JOIN for optional data (like branded_food)
7. Use INNER JOIN for required relationships
*/
