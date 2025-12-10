/**
 * USDA Food Details API
 * Gets full nutrition details for a specific food by FDC ID from Neon Postgres
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, type USDAFood, type USDANutrient, type USDAFoodPortion, type FoodDetails } from '@/lib/usda-postgres';

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

    console.log(`[API] Getting details for FDC ID: ${fdcIdNum}`);
    const startTime = Date.now();

    // Get food details
    const foodResult = await query<USDAFood>(`
      SELECT
        f.fdc_id,
        f.description,
        f.data_type,
        bf.brand_name,
        bf.gtin_upc as upc,
        bf.ingredients
      FROM foods f
      LEFT JOIN branded_foods bf ON f.fdc_id = bf.fdc_id
      WHERE f.fdc_id = $1
    `, [fdcIdNum]);

    const food = foodResult[0];

    if (!food) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    // Get nutrients
    const nutrients = await query<USDANutrient>(`
      SELECT
        n.id,
        n.name,
        n.unit_name,
        fn.amount
      FROM food_nutrients fn
      JOIN nutrients n ON fn.nutrient_id = n.id
      WHERE fn.fdc_id = $1
      ORDER BY n.name
    `, [fdcIdNum]);

    // Get portions
    const portions = await query<USDAFoodPortion>(`
      SELECT
        id,
        portion_description,
        gram_weight
      FROM food_portions
      WHERE fdc_id = $1
      AND gram_weight IS NOT NULL
      ORDER BY gram_weight
    `, [fdcIdNum]);

    const details: FoodDetails = {
      food,
      nutrients,
      portions
    };

    const duration = Date.now() - startTime;
    console.log(`[API] Retrieved ${nutrients.length} nutrients and ${portions.length} portions in ${duration}ms`);

    return NextResponse.json({
      ...details,
      duration
    });

  } catch (error) {
    console.error('[API] Details error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve food details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

