import type { Database } from 'sql.js';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function getUSDADatabase(): Promise<Database> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing initialization promise if in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      console.log('[USDA DB] Initializing database...');

      // Dynamically import sql.js to avoid SSR issues
      console.log('[USDA DB] Loading sql.js...');
      const initSqlJs = (await import('sql.js')).default;

      // Initialize SQL.js
      console.log('[USDA DB] Initializing SQL.js...');
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Fetch the database file
      // Using test DB for now - full 2.1GB DB too large for browser
      console.log('[USDA DB] Fetching test database (100 foods)...');

      const response = await fetch('/usda-test.sqlite');
      if (!response.ok) {
        throw new Error(`Failed to load database: ${response.statusText}`);
      }

      console.log('[USDA DB] Download complete, loading into memory...');
      const buffer = await response.arrayBuffer();
      console.log('[USDA DB] Buffer size:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB');

      const db = new SQL.Database(new Uint8Array(buffer));

      // Test query to verify database
      const testResult = db.exec('SELECT COUNT(*) as count FROM food');
      console.log('[USDA DB] Database contains', testResult[0].values[0][0], 'foods');

      console.log('[USDA DB] Database loaded successfully!');
      dbInstance = db;
      initPromise = null;
      return db;
    } catch (error) {
      console.error('[USDA DB] Initialization error:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

export interface USDAFood {
  fdc_id: number;
  description: string;
  data_type: string;
  brand_name?: string;
  upc?: string;
}

export interface USDANutrient {
  id: number;
  name: string;
  unit_name: string;
  amount: number;
}

export interface USDAFoodPortion {
  id: number;
  portion_description: string | null;
  gram_weight: number;
}

export interface FoodDetails {
  food: USDAFood & { ingredients?: string };
  nutrients: USDANutrient[];
  portions: USDAFoodPortion[];
}

export async function searchFoods(query: string, limit: number = 50): Promise<USDAFood[]> {
  try {
    console.log('[USDA DB] Searching for:', query);
    const db = await getUSDADatabase();
    console.log('[USDA DB] Database loaded, executing query...');

    const results = db.exec(`
      SELECT
        f.fdc_id,
        f.description,
        f.data_type,
        bf.brand_name,
        bf.upc
      FROM food f
      LEFT JOIN branded_food bf ON f.fdc_id = bf.fdc_id
      WHERE f.description LIKE ?
      ORDER BY
        CASE
          WHEN f.description LIKE ? THEN 0
          ELSE 1
        END,
        f.description
      LIMIT ?
    `, [`%${query}%`, `${query}%`, limit]);

    console.log('[USDA DB] Query results:', results.length);

    if (results.length === 0) {
      console.log('[USDA DB] No results found');
      return [];
    }

    const [{ columns, values }] = results;
    console.log('[USDA DB] Found', values.length, 'foods');

    return values.map(row => {
      const food: any = {};
      columns.forEach((col, i) => {
        food[col] = row[i];
      });
      return food as USDAFood;
    });
  } catch (error) {
    console.error('[USDA DB] Search error:', error);
    throw error;
  }
}

export async function getFoodDetails(fdcId: number): Promise<FoodDetails | null> {
  const db = await getUSDADatabase();

  // Get food details
  const foodResults = db.exec(`
    SELECT
      f.fdc_id,
      f.description,
      f.data_type,
      bf.brand_name,
      bf.upc,
      bf.ingredients
    FROM food f
    LEFT JOIN branded_food bf ON f.fdc_id = bf.fdc_id
    WHERE f.fdc_id = ?
  `, [fdcId]);

  if (foodResults.length === 0) return null;

  const [{ columns: foodCols, values: foodVals }] = foodResults;
  const food: any = {};
  foodCols.forEach((col, i) => {
    food[col] = foodVals[0][i];
  });

  // Get nutrients
  const nutrientResults = db.exec(`
    SELECT
      n.id,
      n.name,
      n.unit_name,
      fn.amount
    FROM food_nutrient fn
    JOIN nutrient n ON fn.nutrient_id = n.id
    WHERE fn.fdc_id = ?
    ORDER BY n.name
  `, [fdcId]);

  const nutrients: USDANutrient[] = [];
  if (nutrientResults.length > 0) {
    const [{ columns: nutrientCols, values: nutrientVals }] = nutrientResults;
    nutrientVals.forEach(row => {
      const nutrient: any = {};
      nutrientCols.forEach((col, i) => {
        nutrient[col] = row[i];
      });
      nutrients.push(nutrient as USDANutrient);
    });
  }

  // Get portions
  const portionResults = db.exec(`
    SELECT
      id,
      portion_description,
      gram_weight
    FROM food_portion
    WHERE fdc_id = ?
    AND gram_weight IS NOT NULL
  `, [fdcId]);

  const portions: USDAFoodPortion[] = [];
  if (portionResults.length > 0) {
    const [{ columns: portionCols, values: portionVals }] = portionResults;
    portionVals.forEach(row => {
      const portion: any = {};
      portionCols.forEach((col, i) => {
        portion[col] = row[i];
      });
      portions.push(portion as USDAFoodPortion);
    });
  }

  return {
    food: food as USDAFood & { ingredients?: string },
    nutrients,
    portions
  };
}

export async function lookupByBarcode(upc: string): Promise<FoodDetails | null> {
  const db = await getUSDADatabase();

  const foodResults = db.exec(`
    SELECT
      f.fdc_id,
      f.description,
      f.data_type,
      bf.brand_name,
      bf.upc,
      bf.ingredients
    FROM branded_food bf
    JOIN food f ON bf.fdc_id = f.fdc_id
    WHERE bf.upc = ?
  `, [upc]);

  if (foodResults.length === 0) return null;

  const [{ columns: foodCols, values: foodVals }] = foodResults;
  const food: any = {};
  foodCols.forEach((col, i) => {
    food[col] = foodVals[0][i];
  });

  return getFoodDetails(food.fdc_id);
}
