/**
 * USDA Database - Smart Loading Strategy
 * - Loads Core + Essentials offline (196MB)
 * - Integrates with IndexedDB cache
 * - Supports incremental online loading
 */

import Fuse from 'fuse.js'
import type { Database } from 'sql.js'
import {
  cacheFood,
  getCachedFood,
  searchCachedFoods,
  type CachedFood,
} from './food-cache'

// Database instances
const databases: Map<string, Database> = new Map()
const initPromises: Map<string, Promise<Database>> = new Map()

// Loaded databases
let loadedBundles: Set<string> = new Set()

export interface USDAFood {
  fdc_id: number
  description: string
  data_type: string
  brand_name?: string
  upc?: string
}

export interface USDANutrient {
  id: number
  name: string
  unit_name: string
  amount: number
}

export interface USDAFoodPortion {
  id: number
  portion_description: string | null
  gram_weight: number
}

export interface FoodDetails {
  food: USDAFood & { ingredients?: string }
  nutrients: USDANutrient[]
  portions: USDAFoodPortion[]
}

export interface SearchResult {
  offlineResults: USDAFood[]
  onlineResults?: USDAFood[]
  hasOnline: boolean
  totalOffline: number
  totalOnline?: number
  source: 'cache' | 'offline' | 'hybrid' | 'online'
}

/**
 * Load a database bundle
 */
async function loadBundle(bundleName: string): Promise<Database> {
  // Return existing instance
  if (databases.has(bundleName)) {
    return databases.get(bundleName)!
  }

  // Return existing promise
  if (initPromises.has(bundleName)) {
    return initPromises.get(bundleName)!
  }

  // Start loading
  const promise = (async () => {
    try {
      console.log(`[USDA DB] Loading ${bundleName} bundle...`)

      // Dynamically import sql.js
      const initSqlJs = (await import('sql.js')).default
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      })

      // Fetch database file
      // NOTE: Large database files are now expected from external storage
      // Set NEXT_PUBLIC_DB_BASE_URL environment variable (e.g., "https://your-cdn.com/db")
      const dbBaseUrl = process.env.NEXT_PUBLIC_DB_BASE_URL || '/db'
      const dbUrl = `${dbBaseUrl}/${bundleName}.sqlite`
      const response = await fetch(dbUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to load ${bundleName} from ${dbUrl}. Please configure NEXT_PUBLIC_DB_BASE_URL environment variable or ensure the database file is available at the expected path.`,
        )
      }

      const buffer = await response.arrayBuffer()
      const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2)
      console.log(`[USDA DB] ${bundleName} downloaded (${sizeMB} MB)`)

      const db = new SQL.Database(new Uint8Array(buffer))

      // Test query
      const testResult = db.exec('SELECT COUNT(*) as count FROM food')
      const count = testResult[0].values[0][0]
      console.log(`[USDA DB] ${bundleName} loaded: ${count} foods`)

      databases.set(bundleName, db)
      loadedBundles.add(bundleName)
      initPromises.delete(bundleName)

      return db
    } catch (error) {
      console.error(`[USDA DB] Error loading ${bundleName}:`, error)
      initPromises.delete(bundleName)
      throw error
    }
  })()

  initPromises.set(bundleName, promise)
  return promise
}

/**
 * Ensure essential bundles are loaded
 * Currently only loads core bundle (proteins and dairy not yet deployed)
 */
export async function ensureEssentialBundles(): Promise<void> {
  await loadBundle('usda-core')
}

/**
 * Search in loaded offline databases
 * Returns all foods matching the query (used for Fuse.js fuzzy search)
 */
async function searchOffline(
  query: string,
  limit: number = 50,
): Promise<USDAFood[]> {
  const results: USDAFood[] = []

  // Fetch more results for fuzzy matching (10x limit for better fuzzy results)
  const fetchLimit = Math.max(limit * 10, 500)

  // Search in loaded bundles
  for (const [bundleName, db] of databases.entries()) {
    try {
      const bundleResults = db.exec(
        `
        SELECT
          f.fdc_id,
          f.description,
          f.data_type,
          bf.brand_name,
          bf.upc
        FROM food f
        LEFT JOIN branded_food bf ON f.fdc_id = bf.fdc_id
        WHERE LOWER(f.description) LIKE LOWER(?)
           OR LOWER(bf.brand_name) LIKE LOWER(?)
        LIMIT ?
      `,
        [`%${query}%`, `%${query}%`, fetchLimit - results.length],
      )

      if (bundleResults.length > 0) {
        const [{ columns, values }] = bundleResults
        values.forEach((row) => {
          const food: any = {}
          columns.forEach((col, i) => {
            food[col] = row[i]
          })
          results.push(food as USDAFood)
        })
      }

      if (results.length >= fetchLimit) break
    } catch (error) {
      console.error(`[USDA DB] Error searching ${bundleName}:`, error)
    }
  }

  return results
}

/**
 * Search online API for more results
 */
async function searchOnline(
  query: string,
  limit: number = 50,
): Promise<USDAFood[]> {
  try {
    const response = await fetch(
      `/api/food/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    )
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const data = await response.json()
    console.log(
      `[USDA DB] API returned ${data.results.length}/${data.total} results`,
    )
    return data.results
  } catch (error) {
    console.error('[USDA DB] Online search error:', error)
    return []
  }
}

/**
 * Search foods with smart loading and fuzzy matching
 * Strategy:
 * 1. Search cache (instant)
 * 2. Search offline database (fast)
 * 3. If < 10 results and online, query API (comprehensive)
 */
export async function searchFoods(
  query: string,
  options: {
    limit?: number
    includeCache?: boolean
    offlineOnly?: boolean
    minResultsForOnline?: number
  } = {},
): Promise<SearchResult> {
  const {
    limit = 50,
    includeCache = true,
    offlineOnly = false,
    minResultsForOnline = 10,
  } = options

  try {
    console.log('[USDA DB] Searching for:', query)

    // Ensure essential bundles are loaded
    if (loadedBundles.size === 0) {
      await ensureEssentialBundles()
    }

    // Search in cache if enabled
    let cachedResults: USDAFood[] = []
    if (includeCache) {
      const cached = await searchCachedFoods(query, limit)
      cachedResults = cached.map((c) => ({
        fdc_id: c.fdc_id,
        description: c.description,
        data_type: c.data_type,
        brand_name: c.brand_name,
        upc: c.upc,
      }))
      console.log(`[USDA DB] Found ${cachedResults.length} cached results`)
    }

    // Search offline databases
    const offlineResults = await searchOffline(query, limit)
    console.log(`[USDA DB] Found ${offlineResults.length} offline results`)

    // Merge offline results (remove duplicates)
    const seen = new Set<number>()
    const merged: USDAFood[] = []

    // Add cached results first
    cachedResults.forEach((food) => {
      if (!seen.has(food.fdc_id)) {
        seen.add(food.fdc_id)
        merged.push(food)
      }
    })

    // Add offline results
    offlineResults.forEach((food) => {
      if (!seen.has(food.fdc_id)) {
        seen.add(food.fdc_id)
        merged.push(food)
      }
    })

    // Use Fuse.js for fuzzy search and ranking
    const fuseOptions = {
      shouldSort: true,
      includeScore: true,
      threshold: 0.3, // Lower threshold for tighter results with foods
      distance: 100,
      keys: [
        { name: 'description', weight: 0.7 },
        { name: 'brand_name', weight: 0.2 },
        { name: 'data_type', weight: 0.1 },
      ],
    }

    const fuse = new Fuse(merged, fuseOptions)
    const fuseResults = fuse.search(query)

    // Extract items from Fuse results
    const rankedResults = fuseResults.map((result) => result.item)

    // Debug: Log top 5 results with scores
    if (rankedResults.length > 0) {
      console.log('[USDA DB] Top 5 offline results for "' + query + '":')
      fuseResults.slice(0, 5).forEach((result, idx) => {
        console.log(
          `  ${idx + 1}. [${result.score?.toFixed(3)}] ${
            result.item.description
          }`,
        )
      })
    }

    // Check if we need online results
    const needsOnline =
      !offlineOnly && rankedResults.length < minResultsForOnline
    let onlineResults: USDAFood[] = []
    let source: 'cache' | 'offline' | 'hybrid' | 'online' =
      cachedResults.length > 0 ? 'cache' : 'offline'

    if (needsOnline) {
      console.log(
        `[USDA DB] Only ${rankedResults.length} offline results, querying API...`,
      )
      onlineResults = await searchOnline(query, limit)

      if (onlineResults.length > 0) {
        source = rankedResults.length > 0 ? 'hybrid' : 'online'

        // Merge online results (avoid duplicates)
        onlineResults.forEach((food) => {
          if (!seen.has(food.fdc_id)) {
            seen.add(food.fdc_id)
            rankedResults.push(food)
          }
        })

        console.log(
          `[USDA DB] Total results after API: ${rankedResults.length}`,
        )
      }
    }

    return {
      offlineResults: rankedResults.slice(0, limit),
      onlineResults:
        onlineResults.length > 0 ? onlineResults.slice(0, limit) : undefined,
      hasOnline: needsOnline,
      totalOffline: merged.length,
      totalOnline: onlineResults.length,
      source,
    }
  } catch (error) {
    console.error('[USDA DB] Search error:', error)
    throw error
  }
}

/**
 * Get food details from online API
 */
async function getFoodDetailsOnline(
  fdcId: number,
): Promise<FoodDetails | null> {
  try {
    const response = await fetch(`/api/food/details?fdc_id=${fdcId}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const data = await response.json()
    console.log(`[USDA DB] API returned food details for ${fdcId}`)
    return {
      food: data.food,
      nutrients: data.nutrients,
      portions: data.portions,
    }
  } catch (error) {
    console.error('[USDA DB] Online food details error:', error)
    return null
  }
}

/**
 * Get food details from offline or cache, with API fallback
 */
export async function getFoodDetails(
  fdcId: number,
  options: {
    cacheReason?: 'viewed' | 'logged'
    offlineOnly?: boolean
  } = {},
): Promise<FoodDetails | null> {
  const { cacheReason, offlineOnly = false } = options

  try {
    // Check cache first
    const cached = await getCachedFood(fdcId)
    if (cached) {
      console.log(`[USDA DB] Found ${fdcId} in cache`)
      // Map cached nutrient structure to USDANutrient structure
      const nutrients: USDANutrient[] = cached.nutrients.map((n) => ({
        id: n.nutrient_id,
        name: n.name,
        unit_name: n.unit_name,
        amount: n.amount,
      }))
      return {
        food: {
          fdc_id: cached.fdc_id,
          description: cached.description,
          data_type: cached.data_type,
          brand_name: cached.brand_name,
          upc: cached.upc,
          ingredients: cached.ingredients,
        },
        nutrients: nutrients,
        portions: cached.portions,
      }
    }

    // Ensure essential bundles
    if (loadedBundles.size === 0) {
      await ensureEssentialBundles()
    }

    // Search in loaded databases
    for (const [bundleName, db] of databases.entries()) {
      try {
        // Get food details
        const foodResults = db.exec(
          `
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
        `,
          [fdcId],
        )

        if (foodResults.length === 0) continue

        const [{ columns: foodCols, values: foodVals }] = foodResults
        const food: any = {}
        foodCols.forEach((col, i) => {
          food[col] = foodVals[0][i]
        })

        // Get nutrients
        const nutrientResults = db.exec(
          `
          SELECT
            n.id,
            n.name,
            n.unit_name,
            fn.amount
          FROM food_nutrient fn
          JOIN nutrient n ON fn.nutrient_id = n.id
          WHERE fn.fdc_id = ?
          ORDER BY n.name
        `,
          [fdcId],
        )

        const nutrients: USDANutrient[] = []
        if (nutrientResults.length > 0) {
          const [{ columns: nutrientCols, values: nutrientVals }] =
            nutrientResults
          console.log(
            `[USDA DB] Found ${nutrientVals.length} nutrients for food ${fdcId}`,
          )
          nutrientVals.forEach((row) => {
            const nutrient: any = {}
            nutrientCols.forEach((col, i) => {
              nutrient[col] = row[i]
            })
            nutrients.push(nutrient as USDANutrient)
          })
          console.log(`[USDA DB] Sample nutrients:`, nutrients.slice(0, 5))
        } else {
          console.warn(`[USDA DB] No nutrients found for food ${fdcId}`)
        }

        // Get portions
        const portionResults = db.exec(
          `
          SELECT
            id,
            portion_description,
            gram_weight
          FROM food_portion
          WHERE fdc_id = ?
          AND gram_weight IS NOT NULL
        `,
          [fdcId],
        )

        const portions: USDAFoodPortion[] = []
        if (portionResults.length > 0) {
          const [{ columns: portionCols, values: portionVals }] = portionResults
          portionVals.forEach((row) => {
            const portion: any = {}
            portionCols.forEach((col, i) => {
              portion[col] = row[i]
            })
            portions.push(portion as USDAFoodPortion)
          })
        }

        const details: FoodDetails = {
          food: food as USDAFood & { ingredients?: string },
          nutrients,
          portions,
        }

        // Cache the food if reason provided
        if (cacheReason) {
          const expiresAt =
            cacheReason === 'logged'
              ? null
              : Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
          await cacheFood({
            fdc_id: food.fdc_id,
            description: food.description,
            data_type: food.data_type,
            brand_name: food.brand_name,
            upc: food.upc,
            ingredients: food.ingredients,
            nutrients: nutrients.map((n) => ({
              nutrient_id: n.id,
              name: n.name,
              amount: n.amount,
              unit_name: n.unit_name,
            })),
            portions: portions,
            cached_at: Date.now(),
            cached_reason: cacheReason,
            expires_at: expiresAt,
          })
          console.log(`[USDA DB] Cached ${fdcId} as ${cacheReason}`)
        }

        return details
      } catch (error) {
        console.error(
          `[USDA DB] Error searching ${bundleName} for food ${fdcId}:`,
          error,
        )
      }
    }

    // If not found offline and online is enabled, try API
    if (!offlineOnly) {
      console.log(`[USDA DB] Food ${fdcId} not in offline DB, querying API...`)
      const onlineDetails = await getFoodDetailsOnline(fdcId)

      if (onlineDetails && cacheReason) {
        // Cache the API result
        const expiresAt =
          cacheReason === 'logged'
            ? null
            : Date.now() + 30 * 24 * 60 * 60 * 1000
        await cacheFood({
          fdc_id: onlineDetails.food.fdc_id,
          description: onlineDetails.food.description,
          data_type: onlineDetails.food.data_type,
          brand_name: onlineDetails.food.brand_name,
          upc: onlineDetails.food.upc,
          ingredients: onlineDetails.food.ingredients,
          nutrients: onlineDetails.nutrients.map((n) => ({
            nutrient_id: n.id,
            name: n.name,
            amount: n.amount,
            unit_name: n.unit_name,
          })),
          portions: onlineDetails.portions,
          cached_at: Date.now(),
          cached_reason: cacheReason,
          expires_at: expiresAt,
        })
        console.log(`[USDA DB] Cached API result ${fdcId} as ${cacheReason}`)
      }

      return onlineDetails
    }

    return null
  } catch (error) {
    console.error('[USDA DB] Error getting food details:', error)
    throw error
  }
}

/**
 * Lookup food by barcode
 */
export async function lookupByBarcode(
  upc: string,
): Promise<FoodDetails | null> {
  // Ensure essential bundles
  if (loadedBundles.size === 0) {
    await ensureEssentialBundles()
  }

  // Search in loaded databases
  for (const [bundleName, db] of databases.entries()) {
    try {
      const foodResults = db.exec(
        `
        SELECT
          f.fdc_id
        FROM branded_food bf
        JOIN food f ON bf.fdc_id = f.fdc_id
        WHERE bf.upc = ?
      `,
        [upc],
      )

      if (foodResults.length > 0) {
        const fdcId = foodResults[0].values[0][0] as number
        return getFoodDetails(fdcId, { cacheReason: 'viewed' })
      }
    } catch (error) {
      console.error(
        `[USDA DB] Error searching ${bundleName} for barcode:`,
        error,
      )
    }
  }

  return null
}

/**
 * Get loaded bundles status
 */
export function getLoadedBundles(): string[] {
  return Array.from(loadedBundles)
}

/**
 * Preload essential bundles on app start
 */
export async function preloadEssentials(): Promise<void> {
  console.log('[USDA DB] Preloading essential bundles...')
  await ensureEssentialBundles()
  console.log('[USDA DB] Essential bundles loaded:', getLoadedBundles())
}
