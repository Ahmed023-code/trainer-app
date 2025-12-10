#!/usr/bin/env python3
"""
Build USDA SQLite databases from FoodData Central CSV files.
Filters out useless data types (sub-samples, market acquisitions, experimental foods).
"""

import sqlite3
import csv
import os
from pathlib import Path
from datetime import datetime

# Paths
CSV_DIR = Path("FoodData_Central_csv_2025-04-24")
OUTPUT_DIR = Path("public/db")

# Food types to KEEP
USEFUL_FOOD_TYPES = {
    'sr_legacy_food',
    'foundation_food',
    'survey_fndds_food',
    'branded_food'
}

# Food types to SKIP
SKIP_FOOD_TYPES = {
    'sub_sample_food',
    'market_acquistion',  # Note: typo in actual data
    'agricultural_acquisition',
    'experimental_food',
    'sample_food'
}

def create_database_schema(conn):
    """Create tables with proper schema and indexes"""
    cursor = conn.cursor()

    # Foods table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS foods (
            fdc_id INTEGER PRIMARY KEY,
            data_type TEXT NOT NULL,
            description TEXT NOT NULL,
            food_category_id TEXT,
            publication_date TEXT
        )
    ''')

    # Branded food details
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS branded_foods (
            fdc_id INTEGER PRIMARY KEY,
            brand_owner TEXT,
            brand_name TEXT,
            subbrand_name TEXT,
            gtin_upc TEXT,
            ingredients TEXT,
            serving_size REAL,
            serving_size_unit TEXT,
            household_serving_fulltext TEXT,
            branded_food_category TEXT,
            discontinued_date TEXT,
            FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id)
        )
    ''')

    # Nutrients
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nutrients (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            unit_name TEXT,
            nutrient_nbr TEXT,
            rank REAL
        )
    ''')

    # Food nutrients (the big one)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS food_nutrients (
            id INTEGER PRIMARY KEY,
            fdc_id INTEGER NOT NULL,
            nutrient_id INTEGER NOT NULL,
            amount REAL,
            FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id),
            FOREIGN KEY (nutrient_id) REFERENCES nutrients(id)
        )
    ''')

    # Food portions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS food_portions (
            id INTEGER PRIMARY KEY,
            fdc_id INTEGER NOT NULL,
            seq_num INTEGER,
            amount REAL,
            measure_unit_id INTEGER,
            portion_description TEXT,
            modifier TEXT,
            gram_weight REAL,
            FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id)
        )
    ''')

    # Create indexes for fast lookups
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_foods_data_type ON foods(data_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_branded_gtin ON branded_foods(gtin_upc)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_food_nutrients_fdc ON food_nutrients(fdc_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_food_nutrients_nutrient ON food_nutrients(nutrient_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_food_portions_fdc ON food_portions(fdc_id)')

    conn.commit()
    print("✓ Database schema created")

def read_csv_file(filepath):
    """Read CSV file and return rows as dictionaries"""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        return list(reader)

def insert_foods(conn, csv_dir):
    """Insert foods, filtering out useless types"""
    print("\n📦 Processing foods.csv...")

    foods = read_csv_file(csv_dir / "food.csv")
    cursor = conn.cursor()

    kept = 0
    skipped = 0
    useful_fdc_ids = set()

    for food in foods:
        data_type = food['data_type']

        if data_type in USEFUL_FOOD_TYPES:
            cursor.execute('''
                INSERT INTO foods (fdc_id, data_type, description, food_category_id, publication_date)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                food['fdc_id'],
                data_type,
                food['description'],
                food.get('food_category_id', ''),
                food.get('publication_date', '')
            ))
            useful_fdc_ids.add(int(food['fdc_id']))
            kept += 1
        else:
            skipped += 1

    conn.commit()
    print(f"  ✓ Kept: {kept:,} foods")
    print(f"  ✗ Skipped: {skipped:,} foods ({', '.join(SKIP_FOOD_TYPES)})")

    return useful_fdc_ids

def insert_branded_foods(conn, csv_dir, useful_fdc_ids):
    """Insert branded food details"""
    print("\n🏷️  Processing branded_food.csv...")

    branded = read_csv_file(csv_dir / "branded_food.csv")
    cursor = conn.cursor()

    kept = 0
    skipped = 0

    for food in branded:
        fdc_id = int(food['fdc_id'])

        if fdc_id in useful_fdc_ids:
            # Skip discontinued foods
            if food.get('discontinued_date'):
                skipped += 1
                continue

            cursor.execute('''
                INSERT INTO branded_foods (
                    fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
                    ingredients, serving_size, serving_size_unit,
                    household_serving_fulltext, branded_food_category, discontinued_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                fdc_id,
                food.get('brand_owner', ''),
                food.get('brand_name', ''),
                food.get('subbrand_name', ''),
                food.get('gtin_upc', ''),
                food.get('ingredients', ''),
                food.get('serving_size') or None,
                food.get('serving_size_unit', ''),
                food.get('household_serving_fulltext', ''),
                food.get('branded_food_category', ''),
                food.get('discontinued_date', '')
            ))
            kept += 1
        else:
            skipped += 1

    conn.commit()
    print(f"  ✓ Kept: {kept:,} branded foods")
    print(f"  ✗ Skipped: {skipped:,} (discontinued or useless)")

def insert_nutrients(conn, csv_dir):
    """Insert nutrient definitions"""
    print("\n🧪 Processing nutrient.csv...")

    nutrients = read_csv_file(csv_dir / "nutrient.csv")
    cursor = conn.cursor()

    for nutrient in nutrients:
        cursor.execute('''
            INSERT INTO nutrients (id, name, unit_name, nutrient_nbr, rank)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            nutrient['id'],
            nutrient['name'],
            nutrient.get('unit_name', ''),
            nutrient.get('nutrient_nbr', ''),
            nutrient.get('rank') or None
        ))

    conn.commit()
    print(f"  ✓ Inserted {len(nutrients):,} nutrients")

def insert_food_nutrients(conn, csv_dir, useful_fdc_ids):
    """Insert food-nutrient relationships (filtered to useful foods only)"""
    print("\n🔬 Processing food_nutrient.csv (this will take a while)...")

    cursor = conn.cursor()
    batch = []
    batch_size = 10000
    kept = 0
    skipped = 0

    with open(csv_dir / "food_nutrient.csv", 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)

        for row in reader:
            fdc_id = int(row['fdc_id'])

            if fdc_id in useful_fdc_ids:
                batch.append((
                    row['id'],
                    fdc_id,
                    row['nutrient_id'],
                    row.get('amount') or None
                ))
                kept += 1

                if len(batch) >= batch_size:
                    cursor.executemany('''
                        INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
                        VALUES (?, ?, ?, ?)
                    ''', batch)
                    conn.commit()
                    print(f"  Progress: {kept:,} nutrient records inserted...", end='\r')
                    batch = []
            else:
                skipped += 1

        # Insert remaining
        if batch:
            cursor.executemany('''
                INSERT INTO food_nutrients (id, fdc_id, nutrient_id, amount)
                VALUES (?, ?, ?, ?)
            ''', batch)
            conn.commit()

    print(f"\n  ✓ Kept: {kept:,} nutrient records")
    print(f"  ✗ Skipped: {skipped:,} (for useless foods)")

def insert_food_portions(conn, csv_dir, useful_fdc_ids):
    """Insert food portions/serving sizes"""
    print("\n🥄 Processing food_portion.csv...")

    portions = read_csv_file(csv_dir / "food_portion.csv")
    cursor = conn.cursor()

    kept = 0
    skipped = 0

    for portion in portions:
        fdc_id = int(portion['fdc_id'])

        if fdc_id in useful_fdc_ids:
            cursor.execute('''
                INSERT INTO food_portions (
                    id, fdc_id, seq_num, amount, measure_unit_id,
                    portion_description, modifier, gram_weight
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                portion['id'],
                fdc_id,
                portion.get('seq_num') or None,
                portion.get('amount') or None,
                portion.get('measure_unit_id') or None,
                portion.get('portion_description', ''),
                portion.get('modifier', ''),
                portion.get('gram_weight') or None
            ))
            kept += 1
        else:
            skipped += 1

    conn.commit()
    print(f"  ✓ Kept: {kept:,} portions")
    print(f"  ✗ Skipped: {skipped:,} (for useless foods)")

def optimize_database(conn):
    """Optimize database for performance"""
    print("\n⚡ Optimizing database...")
    cursor = conn.cursor()

    cursor.execute("VACUUM")
    cursor.execute("ANALYZE")

    print("  ✓ Database optimized")

def get_database_stats(conn):
    """Print database statistics"""
    cursor = conn.cursor()

    print("\n📊 Database Statistics:")
    print("=" * 50)

    cursor.execute("SELECT COUNT(*), data_type FROM foods GROUP BY data_type")
    for count, data_type in cursor.fetchall():
        print(f"  {data_type}: {count:,} foods")

    cursor.execute("SELECT COUNT(*) FROM foods")
    total_foods = cursor.fetchone()[0]
    print(f"\n  Total foods: {total_foods:,}")

    cursor.execute("SELECT COUNT(*) FROM food_nutrients")
    total_nutrients = cursor.fetchone()[0]
    print(f"  Total nutrient records: {total_nutrients:,}")

    cursor.execute("SELECT COUNT(*) FROM food_portions")
    total_portions = cursor.fetchone()[0]
    print(f"  Total portion records: {total_portions:,}")

    cursor.execute("SELECT COUNT(*) FROM branded_foods")
    total_branded = cursor.fetchone()[0]
    print(f"  Total branded foods: {total_branded:,}")

def main():
    """Main processing function"""
    print("=" * 50)
    print("USDA Database Builder")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Create database
    db_path = OUTPUT_DIR / "usda-full.sqlite"
    print(f"\n📁 Creating database: {db_path}")

    conn = sqlite3.connect(db_path)

    try:
        # Create schema
        create_database_schema(conn)

        # Insert data (in order of dependencies)
        useful_fdc_ids = insert_foods(conn, CSV_DIR)
        insert_branded_foods(conn, CSV_DIR, useful_fdc_ids)
        insert_nutrients(conn, CSV_DIR)
        insert_food_nutrients(conn, CSV_DIR, useful_fdc_ids)
        insert_food_portions(conn, CSV_DIR, useful_fdc_ids)

        # Optimize
        optimize_database(conn)

        # Stats
        get_database_stats(conn)

        # Get file size
        file_size = os.path.getsize(db_path) / (1024 * 1024)
        print(f"\n💾 Database size: {file_size:.2f} MB")

        print("\n✅ Database created successfully!")
        print(f"   Location: {db_path}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
