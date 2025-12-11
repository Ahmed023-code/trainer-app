/**
 * USDA Food Details API - UI SANDBOX MODE
 * Returns mock nutrition details for UI experiments
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock food database with full nutrition details
const MOCK_FOOD_DETAILS: Record<number, any> = {
  173904: {
    food: { fdc_id: 173904, description: 'Oatmeal, Rolled Oats, Dry', data_type: 'foundation_food', brand_name: null, upc: null },
    nutrients: [
      { id: 1003, name: 'Protein', unit_name: 'g', amount: 13.15 },
      { id: 1004, name: 'Total lipid (fat)', unit_name: 'g', amount: 6.52 },
      { id: 1005, name: 'Carbohydrate, by difference', unit_name: 'g', amount: 67.7 },
      { id: 1008, name: 'Energy', unit_name: 'kcal', amount: 379 },
    ],
    portions: [
      { id: 1, portion_description: '100g', gram_weight: 100 },
      { id: 2, portion_description: '1 cup', gram_weight: 81 },
    ],
  },
  173944: {
    food: { fdc_id: 173944, description: 'Banana, Medium', data_type: 'foundation_food', brand_name: null, upc: null },
    nutrients: [
      { id: 1003, name: 'Protein', unit_name: 'g', amount: 1.09 },
      { id: 1004, name: 'Total lipid (fat)', unit_name: 'g', amount: 0.33 },
      { id: 1005, name: 'Carbohydrate, by difference', unit_name: 'g', amount: 22.84 },
      { id: 1008, name: 'Energy', unit_name: 'kcal', amount: 89 },
    ],
    portions: [
      { id: 1, portion_description: '100g', gram_weight: 100 },
      { id: 2, portion_description: '1 medium (118g)', gram_weight: 118 },
    ],
  },
  171477: {
    food: { fdc_id: 171477, description: 'Grilled Chicken Breast', data_type: 'foundation_food', brand_name: null, upc: null },
    nutrients: [
      { id: 1003, name: 'Protein', unit_name: 'g', amount: 31 },
      { id: 1004, name: 'Total lipid (fat)', unit_name: 'g', amount: 3.6 },
      { id: 1005, name: 'Carbohydrate, by difference', unit_name: 'g', amount: 0 },
      { id: 1008, name: 'Energy', unit_name: 'kcal', amount: 165 },
    ],
    portions: [
      { id: 1, portion_description: '100g', gram_weight: 100 },
      { id: 2, portion_description: '1 breast (172g)', gram_weight: 172 },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fdcId = searchParams.get('fdc_id');

    if (!fdcId) {
      return NextResponse.json(
        { error: 'fdc_id parameter is required' },
        { status: 400 }
      );
    }

    const fdcIdNum = parseInt(fdcId, 10);
    if (isNaN(fdcIdNum)) {
      return NextResponse.json(
        { error: 'fdc_id must be a valid number' },
        { status: 400 }
      );
    }

    console.log(`[API - UI SANDBOX] Getting details for FDC ID: ${fdcIdNum}`);
    const startTime = Date.now();

    // Get mock details or generate generic ones
    let details = MOCK_FOOD_DETAILS[fdcIdNum];

    if (!details) {
      // Generate generic mock data for any FDC ID not in our database
      details = {
        food: {
          fdc_id: fdcIdNum,
          description: `Mock Food ${fdcIdNum}`,
          data_type: 'foundation_food',
          brand_name: null,
          upc: null
        },
        nutrients: [
          { id: 1003, name: 'Protein', unit_name: 'g', amount: 20 },
          { id: 1004, name: 'Total lipid (fat)', unit_name: 'g', amount: 5 },
          { id: 1005, name: 'Carbohydrate, by difference', unit_name: 'g', amount: 30 },
          { id: 1008, name: 'Energy', unit_name: 'kcal', amount: 250 },
        ],
        portions: [
          { id: 1, portion_description: '100g', gram_weight: 100 },
          { id: 2, portion_description: '1 serving', gram_weight: 150 },
        ],
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[API - UI SANDBOX] Retrieved ${details.nutrients.length} nutrients and ${details.portions.length} portions in ${duration}ms`);

    return NextResponse.json({
      ...details,
      duration
    });

  } catch (error) {
    console.error('[API - UI SANDBOX] Details error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve mock food details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

