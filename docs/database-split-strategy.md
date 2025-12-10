# USDA Database Split Strategy

## Overview
Split the 903MB deduplicated database into 15-20 manageable files (30-80MB each) organized by food type.

## Proposed Bundle Structure

### Bundle 1: CORE FOODS (High Quality, Always Load First)
**File**: `usda-core.sqlite` (~15-20MB)
**Categories**:
- SR Legacy Foods (7,793 foods)
- Foundation Foods (411 foods)
- Survey FNDDS Foods (5,432 foods)
**Total**: ~13,600 foods
**Why**: Highest quality USDA lab-tested foods, covers all basic ingredients

---

### Bundle 2: DAIRY & EGGS
**File**: `usda-dairy.sqlite` (~40-50MB)
**Categories**:
- Cheese (30,377)
- Yogurt (16,019)
- Milk (5,317)
- Cream (2,118)
- Butter & Spread (3,065)
- Eggs & Egg Substitutes (1,212)
- Plant Based Milk (2,692)
- Ice Cream & Frozen Yogurt (26,417)
- Yogurt/Yogurt Substitutes (810)
- Cheese/Cheese Substitutes (159)
- Butter/Butter Substitutes (118)
- Cream/Cream Substitutes (115)
**Total**: ~88,000 foods

---

### Bundle 3: BAKERY & GRAINS
**File**: `usda-bakery.sqlite` (~50-60MB)
**Categories**:
- Breads & Buns (18,978)
- Cookies & Biscuits (23,663)
- Cakes, Cupcakes, Snack Cakes (16,397)
- Croissants, Sweet Rolls, Muffins & Pastries (4,845)
- Crackers & Biscotti (7,773)
- Cereal (15,001)
- Bread (1,078)
- Biscuits/Cookies (3,196)
- Sweet Bakery Products (883)
- Savoury Bakery Products (875)
- Frozen Bread & Dough (2,107)
- Crusts & Dough (2,668)
- Bread & Muffin Mixes (2,094)
**Total**: ~99,000 foods

---

### Bundle 4: SNACKS & CANDY
**File**: `usda-snacks.sqlite` (~60-70MB)
**Categories**:
- Candy (37,487)
- Chocolate (17,812)
- Chips, Pretzels & Snacks (19,299)
- Popcorn, Peanuts, Seeds & Related Snacks (36,667)
- Snack, Energy & Granola Bars (15,979)
- Other Snacks (13,972)
- Wholesome Snacks (9,729)
- Snacks (2,353)
- Confectionery Products (857)
- Chewing Gum & Mints (2,793)
- Cereal/Muesli Bars (242)
**Total**: ~157,000 foods

---

### Bundle 5: PROTEINS (MEAT, POULTRY, SEAFOOD)
**File**: `usda-proteins.sqlite` (~25-35MB)
**Categories**:
- Pepperoni, Salami & Cold Cuts (8,349)
- Sausages, Hotdogs & Brats (7,875)
- Bacon, Sausages & Ribs (2,878)
- Poultry, Chicken & Turkey (1,181)
- Other Meats (3,719)
- Fish & Seafood (2,157)
- Frozen Fish & Seafood (6,238)
- Canned Seafood (2,353)
- Canned Tuna (1,629)
- Canned Meat (1,402)
- Other Deli (4,892)
- Frozen Poultry, Chicken & Turkey (768)
- Frozen Bacon, Sausages & Ribs (701)
- Frozen Sausages, Hotdogs & Brats (473)
- Other Frozen Meats (331)
- Shellfish Unprepared/Unprocessed (803)
- Fish Unprepared/Unprocessed (462 + 499)
- Meat/Poultry/Other Animals Prepared/Processed (3,816 + 526 + 130)
- Meat/Poultry/Other Animals Unprepared/Unprocessed (1,512 + 248)
- Meat/Poultry/Other Animals Sausages Prepared/Processed (386 + 92)
- Eggs & Egg Substitutes (1,212)
**Total**: ~54,000 foods

---

### Bundle 6: VEGETABLES & BEANS
**File**: `usda-vegetables.sqlite` (~20-30MB)
**Categories**:
- Frozen Vegetables (6,489)
- Canned Vegetables (5,742)
- Pre-Packaged Fruit & Vegetables (9,215)
- Tomatoes (4,091)
- Canned & Bottled Beans (4,518)
- Pickles, Olives, Peppers & Relishes (17,256)
- Vegetable and Lentil Mixes (2,533)
- Vegetables Prepared/Processed (1,284 + 317 + 115)
- Vegetable Based Products/Meals (643 + 112)
- Vegetarian Frozen Meats (636)
**Total**: ~54,000 foods

---

### Bundle 7: FRUITS
**File**: `usda-fruits.sqlite` (~15-20MB)
**Categories**:
- Canned Fruit (5,270)
- Frozen Fruit & Fruit Juice Concentrates (3,815)
- Jam, Jelly & Fruit Spreads (6,064)
- Fruit Prepared/Processed (413 + 106 + 47)
**Total**: ~16,000 foods

---

### Bundle 8: BEVERAGES
**File**: `usda-beverages.sqlite` (~40-50MB)
**Categories**:
- Soda (11,978)
- Fruit & Vegetable Juice, Nectars & Fruit Drinks (16,981)
- Water (8,759)
- Other Drinks (8,679)
- Powdered Drinks (7,913)
- Coffee (835)
- Tea Bags (3,109)
- Iced & Bottle Tea (4,033)
- Energy, Protein & Muscle Recovery Drinks (4,223)
- Sport Drinks (1,165)
- Milk Additives (2,865)
- Plant Based Water (1,064)
- Liquid Water Enhancer (1,601)
- Alcohol (1,801)
- Non Alcoholic Beverages Ready to Drink (2,145 + 545 + 385)
- Non Alcoholic Beverages Not Ready to Drink (192 + 103)
- Coffee/Tea/Substitutes (197)
- Breakfast Drinks (145)
**Total**: ~79,000 foods

---

### Bundle 9: SAUCES & CONDIMENTS
**File**: `usda-sauces.sqlite` (~40-50MB)
**Categories**:
- Ketchup, Mustard, BBQ & Cheese Sauce (11,780)
- Salad Dressing & Mayonnaise (10,519)
- Dips & Salsa (12,301)
- Prepared Pasta & Pizza Sauces (6,508)
- Oriental, Mexican & Ethnic Sauces (6,649)
- Other Cooking Sauces (3,542)
- Seasoning Mixes, Salts, Marinades & Tenderizers (14,858)
- Herbs & Spices (3,625)
- Syrups & Molasses (3,109)
- Gravy Mix (1,349)
- Other Condiments (916)
- Sauces/Spreads/Dips/Condiments (1,598)
- Herbs/Spices/Extracts (309)
**Total**: ~77,000 foods

---

### Bundle 10: PASTA & RICE
**File**: `usda-pasta-rice.sqlite` (~20-25MB)
**Categories**:
- Pasta by Shape & Type (12,150)
- Pasta Dinners (3,154)
- All Noodles (1,840)
- Rice (2,595)
- Flavored Rice Dishes (1,713)
- Pasta/Noodles (372)
**Total**: ~22,000 foods

---

### Bundle 11: SOUPS & PREPARED MEALS
**File**: `usda-soups-meals.sqlite` (~25-35MB)
**Categories**:
- Other Soups (5,705)
- Canned Soup (4,139)
- Canned Condensed Soup (1,236)
- Prepared Soups (2,309)
- Chili & Stew (2,001)
- Frozen Dinners & Entrees (12,314)
- Ready-Made Combination Meals (453)
- Entrees, Sides & Small Meals (2,657)
- Frozen Prepared Sides (1,652)
**Total**: ~32,000 foods

---

### Bundle 12: RESTAURANT & FAST FOOD
**File**: `usda-restaurant.sqlite` (~20-30MB)
**Categories**:
- Fast Foods - Category 21 (312)
- Pizza (7,918)
- Prepared Subs & Sandwiches (1,753)
- Prepared Wraps and Burittos (1,007)
- Sushi (849)
- Frozen Breakfast Sandwiches, Biscuits & Meals (2,127)
- Breakfast Sandwiches, Biscuits & Meals (486)
- Sandwiches/Filled Rolls/Wraps (532)
- Frozen Patties and Burgers (2,337)
- French Fries, Potatoes & Onion Rings (1,747)
**Total**: ~19,000 foods

---

### Bundle 13: FROZEN FOODS
**File**: `usda-frozen.sqlite` (~30-40MB)
**Categories**:
- Frozen Appetizers & Hors D'oeuvres (9,917)
- Other Frozen Desserts (4,074)
- Frozen Pancakes, Waffles, French Toast & Crepes (1,611)
- Dough Based Products/Meals (1,062)
**Total**: ~17,000 foods

---

### Bundle 14: BAKING & COOKING SUPPLIES
**File**: `usda-baking.sqlite` (~20-30MB)
**Categories**:
- Vegetable & Cooking Oils (5,931)
- Baking Decorations & Dessert Toppings (6,837)
- Cake, Cookie & Cupcake Mixes (6,789)
- Flours & Corn Meal (2,049)
- Granulated, Brown & Powdered Sugar (2,721)
- Honey (1,889)
- Baking Additives & Extracts (1,320)
- Baking/Cooking Mixes/Supplies (1,277)
- Pastry Shells & Fillings (986)
- Other Grains & Seeds (1,879)
- Nut & Seed Butters (4,346)
- Oils Edible (168)
- Grains/Flour (296)
**Total**: ~36,000 foods

---

### Bundle 15: DESSERTS & SWEET TREATS
**File**: `usda-desserts.sqlite` (~10-15MB)
**Categories**:
- Puddings & Custards (2,301)
- Gelatin, Gels, Pectins & Desserts (1,602)
- Desserts/Dessert Sauces/Toppings (637)
**Total**: ~4,500 foods

---

### Bundle 16: LUNCH & CONVENIENCE FOODS
**File**: `usda-convenience.sqlite` (~15-20MB)
**Categories**:
- Lunch Snacks & Combinations (1,821)
- Deli Salads (2,090)
- Cooked & Prepared (2,272)
- Processed Cereal Products (2,240)
- Pizza Mixes & Other Dry Dinners (1,111)
- Stuffing (648)
- Mexican Dinner Mixes (2,725)
**Total**: ~13,000 foods

---

### Bundle 17: SUPPLEMENTS & SPECIALTY
**File**: `usda-supplements.sqlite` (~5-10MB)
**Categories**:
- Specialty Formula Supplements (468)
- Meal Replacement Supplements (319)
- Weight Control (187)
- Health Care (123)
**Total**: ~1,100 foods

---

## Implementation Strategy

### Phase 1: Create Core Database
1. Extract SR Legacy + Foundation + Survey foods
2. This becomes the always-loaded base (~15-20MB)
3. Users can search immediately

### Phase 2: Create Bundles
1. Run split script to create 17 separate SQLite files
2. Each bundle is 5-70MB (browser-friendly)
3. Total after split: ~150-300MB (instead of 903MB)

### Phase 3: Smart Loading
1. Load Core database on app start
2. Detect search query intent ("chicken" → load Proteins bundle)
3. Cache loaded bundles for session
4. Preload popular bundles (Proteins, Dairy, Snacks)

### Phase 4: Advanced Features
1. Allow users to download specific bundles offline
2. Show which bundles are loaded in UI
3. "Download all" option for full offline access

---

## Bundle Size Estimates

| Bundle | Foods | Est. Size | Priority |
|--------|-------|-----------|----------|
| Core Foods | 13,600 | 15-20 MB | ⭐⭐⭐⭐⭐ Always |
| Dairy & Eggs | 88,000 | 40-50 MB | ⭐⭐⭐⭐ High |
| Bakery & Grains | 99,000 | 50-60 MB | ⭐⭐⭐ Medium |
| Snacks & Candy | 157,000 | 60-70 MB | ⭐⭐⭐⭐ High |
| Proteins | 54,000 | 25-35 MB | ⭐⭐⭐⭐⭐ Critical |
| Vegetables | 54,000 | 20-30 MB | ⭐⭐⭐⭐ High |
| Fruits | 16,000 | 15-20 MB | ⭐⭐⭐ Medium |
| Beverages | 79,000 | 40-50 MB | ⭐⭐⭐ Medium |
| Sauces & Condiments | 77,000 | 40-50 MB | ⭐⭐⭐ Medium |
| Pasta & Rice | 22,000 | 20-25 MB | ⭐⭐⭐⭐ High |
| Soups & Meals | 32,000 | 25-35 MB | ⭐⭐⭐ Medium |
| Restaurant | 19,000 | 20-30 MB | ⭐⭐⭐⭐ High |
| Frozen Foods | 17,000 | 30-40 MB | ⭐⭐ Low |
| Baking Supplies | 36,000 | 20-30 MB | ⭐⭐ Low |
| Desserts | 4,500 | 10-15 MB | ⭐⭐ Low |
| Convenience | 13,000 | 15-20 MB | ⭐⭐ Low |
| Supplements | 1,100 | 5-10 MB | ⭐ Very Low |

**Total**: ~863,000 foods across 17 bundles

---

## Search Strategy

When user searches:
1. Search Core database first (instant results)
2. Detect keywords:
   - "chicken", "beef", "fish" → Load Proteins
   - "cheese", "milk", "yogurt" → Load Dairy
   - "bread", "cookie", "cake" → Load Bakery
   - "chip", "candy", "chocolate" → Load Snacks
   - "mcdonald", "pizza", "burger" → Load Restaurant
3. Load relevant bundle in background
4. Merge results and display

---

## Benefits

✅ **Core database loads instantly** (15-20MB)
✅ **On-demand loading** for specific food types
✅ **Reduced initial download** from 903MB → 20MB
✅ **Progressive enhancement** - load more as needed
✅ **Works in browser** - all files under 70MB
✅ **Offline-capable** - cache bundles locally
✅ **Better UX** - fast search for common foods
