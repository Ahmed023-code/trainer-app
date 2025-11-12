/**
 * IndexedDB Food Cache
 * Caches user-logged and viewed foods for offline access
 */

const DB_NAME = 'trainer_app_food_cache';
const DB_VERSION = 1;
const STORE_NAME = 'foods';

export interface CachedFood {
  fdc_id: number;
  description: string;
  data_type: string;
  food_category_id?: string;
  brand_name?: string;
  upc?: string;
  ingredients?: string;
  nutrients: Array<{
    nutrient_id: number;
    name: string;
    amount: number;
    unit_name: string;
  }>;
  portions: Array<{
    id: number;
    portion_description: string;
    gram_weight: number;
  }>;
  cached_at: number;
  cached_reason: 'viewed' | 'logged';
  expires_at: number | null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'fdc_id' });
        store.createIndex('cached_reason', 'cached_reason', { unique: false });
        store.createIndex('cached_at', 'cached_at', { unique: false });
        store.createIndex('expires_at', 'expires_at', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Cache a food item
 */
export async function cacheFood(food: CachedFood): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(food);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached food by FDC ID
 */
export async function getCachedFood(fdcId: number): Promise<CachedFood | null> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(fdcId);
    request.onsuccess = () => {
      const food = request.result as CachedFood | undefined;

      // Check if expired
      if (food && food.expires_at && food.expires_at < Date.now()) {
        // Delete expired food
        deleteCachedFood(fdcId);
        resolve(null);
      } else {
        resolve(food || null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Search cached foods
 */
export async function searchCachedFoods(query: string, limit: number = 50): Promise<CachedFood[]> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const foods = (request.result as CachedFood[]) || [];
      const lowerQuery = query.toLowerCase();

      // Filter by description and remove expired
      const filtered = foods
        .filter(food => {
          // Remove expired
          if (food.expires_at && food.expires_at < Date.now()) {
            deleteCachedFood(food.fdc_id);
            return false;
          }

          // Search in description and brand name
          const desc = food.description.toLowerCase();
          const brand = (food.brand_name || '').toLowerCase();
          return desc.includes(lowerQuery) || brand.includes(lowerQuery);
        })
        .slice(0, limit);

      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete cached food
 */
export async function deleteCachedFood(fdcId: number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(fdcId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get logged foods sorted by most recent
 */
export async function getLoggedFoods(limit?: number): Promise<CachedFood[]> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('cached_reason');

  return new Promise((resolve, reject) => {
    const request = index.getAll('logged');
    request.onsuccess = () => {
      let foods = (request.result as CachedFood[]) || [];

      // Sort by most recent first
      foods.sort((a, b) => b.cached_at - a.cached_at);

      // Apply limit if specified
      if (limit) {
        foods = foods.slice(0, limit);
      }

      resolve(foods);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear viewed foods (keep logged foods)
 */
export async function clearViewedFoods(): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('cached_reason');

  return new Promise((resolve, reject) => {
    const request = index.getAllKeys('viewed');
    request.onsuccess = () => {
      const keys = request.result;
      let pending = keys.length;

      if (pending === 0) {
        resolve();
        return;
      }

      keys.forEach(key => {
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => {
          pending--;
          if (pending === 0) resolve();
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear expired foods
 */
export async function clearExpiredFoods(): Promise<number> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const foods = (request.result as CachedFood[]) || [];
      const now = Date.now();
      const expired = foods.filter(f => f.expires_at && f.expires_at < now);

      let pending = expired.length;
      if (pending === 0) {
        resolve(0);
        return;
      }

      expired.forEach(food => {
        const deleteRequest = store.delete(food.fdc_id);
        deleteRequest.onsuccess = () => {
          pending--;
          if (pending === 0) resolve(expired.length);
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalFoods: number;
  loggedFoods: number;
  viewedFoods: number;
  estimatedSize: number;
}> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const foods = (request.result as CachedFood[]) || [];
      const logged = foods.filter(f => f.cached_reason === 'logged').length;
      const viewed = foods.filter(f => f.cached_reason === 'viewed').length;

      // Rough size estimate (average 5KB per food)
      const estimatedSize = foods.length * 5 * 1024;

      resolve({
        totalFoods: foods.length,
        loggedFoods: logged,
        viewedFoods: viewed,
        estimatedSize
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
