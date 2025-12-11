/**
 * USDA Food Search API - UI SANDBOX MODE
 * Returns mock food data for UI experiments
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock food database for UI sandbox
const MOCK_FOODS = [
  { fdc_id: 173904, description: 'Oatmeal, Rolled Oats, Dry', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 173944, description: 'Banana, Medium', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 174802, description: 'Whey Protein Isolate', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170567, description: 'Almond Butter', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171711, description: 'Blueberries, Fresh', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171287, description: 'Egg Whites, Liquid', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 168874, description: 'Whole Wheat Toast', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171705, description: 'Avocado', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171477, description: 'Grilled Chicken Breast', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 168876, description: 'Brown Rice', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170393, description: 'Mixed Vegetables', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171286, description: 'Whole Eggs', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 173410, description: 'Turkey Sandwich', data_type: 'branded_food', brand_name: 'Generic', upc: null },
  { fdc_id: 170895, description: 'Greek Yogurt', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 175167, description: 'Salmon Fillet', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170026, description: 'Sweet Potato', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170379, description: 'Broccoli', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 174032, description: 'Lean Beef', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 169736, description: 'Pasta', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170900, description: 'Marinara Sauce', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 174803, description: 'Protein Shake', data_type: 'branded_food', brand_name: 'Generic', upc: null },
  { fdc_id: 171688, description: 'Apple', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170581, description: 'Mixed Nuts', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 173096, description: 'White Rice', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171706, description: 'Strawberries', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 171284, description: 'Cheddar Cheese', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 170450, description: 'Spinach', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 173420, description: 'Peanut Butter', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 175174, description: 'Tilapia', data_type: 'foundation_food', brand_name: null, upc: null },
  { fdc_id: 173745, description: 'Ground Turkey', data_type: 'foundation_food', brand_name: null, upc: null },
];

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

    console.log(`[API - UI SANDBOX] Searching for: "${query}" (limit: ${limit}, offset: ${offset})`);
    const startTime = Date.now();

    // Filter mock foods by query
    const queryLower = query.toLowerCase();
    const allResults = MOCK_FOODS.filter(food =>
      food.description.toLowerCase().includes(queryLower) ||
      (food.brand_name && food.brand_name.toLowerCase().includes(queryLower))
    );

    // Sort by relevance (exact matches first, then starts with, then contains)
    allResults.sort((a, b) => {
      const aDesc = a.description.toLowerCase();
      const bDesc = b.description.toLowerCase();
      if (aDesc === queryLower) return -1;
      if (bDesc === queryLower) return 1;
      if (aDesc.startsWith(queryLower)) return -1;
      if (bDesc.startsWith(queryLower)) return 1;
      return 0;
    });

    // Paginate results
    const results = allResults.slice(offset, offset + limit);
    const total = allResults.length;

    const duration = Date.now() - startTime;
    console.log(`[API - UI SANDBOX] Found ${results.length}/${total} results in ${duration}ms`);

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      duration
    });

  } catch (error) {
    console.error('[API - UI SANDBOX] Search error:', error);
    return NextResponse.json(
      {
        error: 'Mock search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

