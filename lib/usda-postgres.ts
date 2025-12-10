/**
 * USDA Database - Postgres/Neon Connection
 * Server-side connection to Neon Postgres database
 */

import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create Postgres connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    console.log('[Postgres] Creating connection pool');
    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[Postgres] Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Execute a query with the pool
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 100) {
      console.log('[Postgres] Slow query executed', { text, duration, rows: result.rowCount });
    }

    return result.rows as T[];
  } catch (error) {
    console.error('[Postgres] Query error', { text, params, error });
    throw error;
  }
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    console.log('[Postgres] Closing connection pool');
    await pool.end();
    pool = null;
  }
}

// Types matching the database schema
export interface USDAFood {
  fdc_id: number;
  description: string;
  data_type: string;
  brand_name?: string;
  gtin_upc?: string;
  ingredients?: string;
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
  food: USDAFood;
  nutrients: USDANutrient[];
  portions: USDAFoodPortion[];
}
