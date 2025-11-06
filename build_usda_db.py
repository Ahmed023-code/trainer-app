#!/usr/bin/env python3
"""
USDA FoodData Central SQLite Database Builder
Imports CSV files from USDA/FOODS/ into a local SQLite database
"""

import sqlite3
import csv
import os
from pathlib import Path

# Paths
USDA_FOLDER = Path("USDA/FOODS")
DB_PATH = "usda.sqlite"

# CSV to Table mappings with column selections
CSV_MAPPINGS = {
    "food.csv": {
        "table": "food",
        "columns": ["fdc_id", "description", "data_type", "food_category_id"],
        "csv_columns": ["fdc_id", "description", "data_type", "food_category_id"]
    },
    "branded_food.csv": {
        "table": "branded_food",
        "columns": ["fdc_id", "upc", "brand_name", "ingredients"],
        "csv_columns": ["fdc_id", "gtin_upc", "brand_name", "ingredients"]
    },
    "nutrient.csv": {
        "table": "nutrient",
        "columns": ["id", "name", "unit_name"],
        "csv_columns": ["id", "name", "unit_name"]
    },
    "food_nutrient.csv": {
        "table": "food_nutrient",
        "columns": ["id", "fdc_id", "nutrient_id", "amount"],
        "csv_columns": ["id", "fdc_id", "nutrient_id", "amount"]
    },
    "food_portion.csv": {
        "table": "food_portion",
        "columns": ["id", "fdc_id", "portion_description", "gram_weight"],
        "csv_columns": ["id", "fdc_id", "portion_description", "gram_weight"]
    }
}


def create_schema(conn):
    """Create all database tables"""
    cursor = conn.cursor()

    # Drop existing tables
    cursor.execute("DROP TABLE IF EXISTS food_portion")
    cursor.execute("DROP TABLE IF EXISTS food_nutrient")
    cursor.execute("DROP TABLE IF EXISTS branded_food")
    cursor.execute("DROP TABLE IF EXISTS nutrient")
    cursor.execute("DROP TABLE IF EXISTS food")

    # Create tables
    cursor.execute("""
        CREATE TABLE food (
            fdc_id INTEGER PRIMARY KEY,
            description TEXT,
            data_type TEXT,
            food_category_id INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE branded_food (
            fdc_id INTEGER PRIMARY KEY,
            upc TEXT,
            brand_name TEXT,
            ingredients TEXT,
            FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE nutrient (
            id INTEGER PRIMARY KEY,
            name TEXT,
            unit_name TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE food_nutrient (
            id INTEGER PRIMARY KEY,
            fdc_id INTEGER,
            nutrient_id INTEGER,
            amount REAL,
            FOREIGN KEY(fdc_id) REFERENCES food(fdc_id),
            FOREIGN KEY(nutrient_id) REFERENCES nutrient(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE food_portion (
            id INTEGER PRIMARY KEY,
            fdc_id INTEGER,
            portion_description TEXT,
            gram_weight REAL,
            FOREIGN KEY(fdc_id) REFERENCES food(fdc_id)
        )
    """)

    conn.commit()
    print("✓ Schema created successfully")


def import_csv(conn, csv_file, table_name, columns, csv_columns):
    """Import CSV file into database table"""
    csv_path = USDA_FOLDER / csv_file

    if not csv_path.exists():
        print(f"✗ File not found: {csv_path}")
        return 0

    cursor = conn.cursor()
    row_count = 0
    batch_size = 10000
    batch = []

    print(f"Importing {csv_file} into {table_name}...")

    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)

        # Build placeholder string for SQL
        placeholders = ','.join(['?' for _ in columns])
        sql = f"INSERT OR IGNORE INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"

        for row in reader:
            try:
                # Extract only the columns we need
                values = []
                for csv_col in csv_columns:
                    val = row.get(csv_col, '').strip()
                    # Convert empty strings to NULL for numeric fields
                    if val == '':
                        val = None
                    values.append(val)

                batch.append(tuple(values))
                row_count += 1

                # Batch insert for performance
                if len(batch) >= batch_size:
                    cursor.executemany(sql, batch)
                    batch = []
                    if row_count % 100000 == 0:
                        print(f"  {row_count:,} rows processed...")
                        conn.commit()

            except Exception as e:
                print(f"  Warning: Skipping row {row_count} due to error: {e}")
                continue

        # Insert remaining batch
        if batch:
            cursor.executemany(sql, batch)

        conn.commit()

    print(f"✓ Imported {row_count:,} rows into {table_name}")
    return row_count


def create_indexes(conn):
    """Create performance indexes"""
    cursor = conn.cursor()

    print("Creating indexes...")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_food_description ON food(description)")
    print("  ✓ Created index on food.description")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_branded_upc ON branded_food(upc)")
    print("  ✓ Created index on branded_food.upc")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_foodnutrient_fdc ON food_nutrient(fdc_id)")
    print("  ✓ Created index on food_nutrient.fdc_id")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_foodnutrient_nutrient ON food_nutrient(nutrient_id)")
    print("  ✓ Created index on food_nutrient.nutrient_id")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_foodportion_fdc ON food_portion(fdc_id)")
    print("  ✓ Created index on food_portion.fdc_id")

    conn.commit()
    print("✓ All indexes created")


def verify_database(conn):
    """Run test queries to verify database"""
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("VERIFICATION TESTS")
    print("="*60)

    # Test 1: Count records
    print("\n1. Record counts:")
    for table in ["food", "branded_food", "nutrient", "food_nutrient", "food_portion"]:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"   {table}: {count:,} records")

    # Test 2: Search food by name
    print("\n2. Search test (chicken):")
    cursor.execute("SELECT fdc_id, description FROM food WHERE description LIKE '%chicken%' LIMIT 5")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]}")

    # Test 3: Get nutrients for first food item
    print("\n3. Nutrient lookup test:")
    cursor.execute("SELECT fdc_id FROM food LIMIT 1")
    fdc_id = cursor.fetchone()[0]

    cursor.execute("""
        SELECT n.name, fn.amount, n.unit_name
        FROM food_nutrient fn
        JOIN nutrient n ON fn.nutrient_id = n.id
        WHERE fn.fdc_id = ?
        LIMIT 10
    """, (fdc_id,))

    print(f"   Nutrients for fdc_id {fdc_id}:")
    for row in cursor.fetchall():
        print(f"   - {row[0]}: {row[1]} {row[2]}")

    # Test 4: Barcode lookup
    print("\n4. Barcode lookup test:")
    cursor.execute("SELECT fdc_id, upc, brand_name FROM branded_food WHERE upc IS NOT NULL LIMIT 5")
    for row in cursor.fetchall():
        print(f"   UPC {row[1]}: {row[2]} (fdc_id: {row[0]})")

    # Test 5: Portion sizes
    print("\n5. Portion size test:")
    cursor.execute("""
        SELECT f.description, fp.portion_description, fp.gram_weight
        FROM food_portion fp
        JOIN food f ON fp.fdc_id = f.fdc_id
        WHERE fp.gram_weight IS NOT NULL
        LIMIT 5
    """)
    for row in cursor.fetchall():
        print(f"   {row[0][:40]}: {row[1]} = {row[2]}g")

    # Database size
    print("\n6. Database statistics:")
    db_size = os.path.getsize(DB_PATH) / (1024 * 1024)
    print(f"   Database size: {db_size:.2f} MB")

    print("\n" + "="*60)
    print("✓ All verification tests completed")
    print("="*60)


def main():
    """Main execution function"""
    print("="*60)
    print("USDA FOODDATA CENTRAL SQLITE DATABASE BUILDER")
    print("="*60)

    # Remove old database
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")

    # Create connection
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")  # Performance optimization
    conn.execute("PRAGMA synchronous=NORMAL")  # Performance optimization

    try:
        # Step 1: Create schema
        create_schema(conn)

        # Step 2: Import CSVs
        print("\n" + "="*60)
        print("IMPORTING CSV FILES")
        print("="*60 + "\n")

        for csv_file, config in CSV_MAPPINGS.items():
            import_csv(
                conn,
                csv_file,
                config["table"],
                config["columns"],
                config["csv_columns"]
            )
            print()

        # Step 3: Create indexes
        print("="*60)
        print("CREATING INDEXES")
        print("="*60 + "\n")
        create_indexes(conn)

        # Step 4: Verify
        verify_database(conn)

        print("\n✓ Database build completed successfully!")
        print(f"✓ Output: {DB_PATH}")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
