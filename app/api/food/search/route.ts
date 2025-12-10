/**
 * USDA Food Search API
 * Searches the Neon Postgres database (13K core foods)
 * Used as fallback when offline database doesn't have enough results
 */

import { NextRequest, NextResponse } from 'next/server';
import { query as pgQuery, type USDAFood } from '@/lib/usda-postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`[API] Searching for: "${query}" (limit: ${limit}, offset: ${offset})`);
    const startTime = Date.now();

    // Search query with fuzzy matching
    const searchPattern = `%${query.toLowerCase()}%`;

    const results = await pgQuery<USDAFood>(`
      SELECT
        f.fdc_id,
        f.description,
        f.data_type,
        bf.brand_name,
        bf.gtin_upc as upc
      FROM foods f
      LEFT JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
      WHERE LOWER(f.description) LIKE $1
         OR LOWER(bf.brand_name) LIKE $2
      ORDER BY
        CASE
          -- Exact matches first
          WHEN LOWER(f.description) = LOWER($3) THEN 1
          -- Starts with query
          WHEN LOWER(f.description) LIKE $4 THEN 2
          -- Brand name matches
          WHEN LOWER(bf.brand_name) LIKE $5 THEN 3
          -- Contains query
          ELSE 4
        END,
        f.description
      LIMIT $6 OFFSET $7
    `, [
      searchPattern,
      searchPattern,
      query.toLowerCase(),
      `${query.toLowerCase()}%`,
      `${query.toLowerCase()}%`,
      limit,
      offset
    ]);

    // Get total count for pagination
    const countResult = await pgQuery<{ total: string }>(`
      SELECT COUNT(*) as total
      FROM foods f
      LEFT JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
      WHERE LOWER(f.description) LIKE $1
         OR LOWER(bf.brand_name) LIKE $2
    `, [searchPattern, searchPattern]);

    const total = parseInt(countResult[0].total, 10);

    const duration = Date.now() - startTime;
    console.log(`[API] Found ${results.length}/${total} results in ${duration}ms`);

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      duration
    });

  } catch (error) {
    console.error('[API] Search error:', error);
    return NextResponse.json(
      {
        error: 'Database search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

