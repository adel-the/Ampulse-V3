# Convention Prix Diagnostic Scripts

This directory contains diagnostic scripts to help debug and validate the ConventionPrix component data flow.

## Scripts Overview

### 1. `diagnose-convention-prix.js`

A comprehensive diagnostic script that tests the entire Convention Prix data flow from database to component rendering.

**Purpose:**
- Loads a specific client with conventions from the database
- Shows the exact data structure returned by the API
- Simulates the transformation that should happen in the component
- Verifies that transformed data matches what ConventionPrix expects
- Tests if the data would display correctly in the UI

**Usage:**
```bash
# Test with a specific client ID
npm run diagnose:convention-prix 30

# Or run directly with Node
node scripts/diagnose-convention-prix.js 30

# If no client ID provided, defaults to ID 31
npm run diagnose:convention-prix
```

**What it checks:**
1. **Room Categories Loading** - Verifies room categories exist and are accessible
2. **Client Data Loading** - Fetches client with conventions and referents
3. **Convention Data Structure** - Analyzes the raw convention data from database
4. **Data Transformation** - Simulates how data should be converted for ConventionPrix
5. **Structure Validation** - Ensures transformed data matches expected interface
6. **Component Compatibility** - Tests if data would render correctly
7. **Debugging Recommendations** - Provides specific guidance based on findings
8. **SQL Queries** - Offers debugging queries for manual database inspection

### 2. `create-test-convention.js`

Creates sample convention data for testing purposes.

**Purpose:**
- Generates realistic pricing data for all room categories
- Creates conventions with varied pricing (seasonal, peak periods)
- Inserts test data into the `conventions_tarifaires` table
- Provides data to test the diagnostic script with

**Usage:**
```bash
# Create test convention data
npm run create-test-convention

# Or run directly
node scripts/create-test-convention.js
```

**What it creates:**
- Convention records for each room category
- Varied pricing: default prices + seasonal adjustments
- Monthly price variations (peak summer, holiday seasons)
- Sample conditions text for each category
- Active convention status for immediate testing

## Database Schema

The scripts work with the current database schema where conventions are stored as individual records per category:

```sql
conventions_tarifaires:
- id (primary key)
- client_id (references clients.id)
- category_id (references room_categories.id)
- date_debut, date_fin (convention period)
- prix_defaut (default price for category)
- prix_janvier, prix_fevrier, ... prix_decembre (monthly prices)
- conditions (text conditions)
- active (boolean)
- hotel_id (references hotels.id)
```

## Expected ConventionPrix Interface

The diagnostic script validates against this interface:

```typescript
interface CategoryPricing {
  categoryId: string;      // Room category ID
  categoryName: string;    // Room category name  
  defaultPrice: number;    // Default price
  monthlyPrices: {         // Monthly prices object
    janvier?: number;
    fevrier?: number;
    // ... all 12 months
  };
  conditions?: string;     // Optional conditions
}
```

## Troubleshooting Guide

### Issue: "No room categories found"
- Check if room categories exist in the database
- Verify user permissions to access room_categories table
- Run: `SELECT * FROM room_categories;`

### Issue: "No client found"
- Use a valid client ID from the database
- Check: `SELECT id, nom, prenom FROM clients LIMIT 10;`
- Try with different client IDs

### Issue: "No conventions found"
- Client exists but has no conventions
- Either create test data with `create-test-convention.js`
- Or check existing conventions: `SELECT * FROM conventions_tarifaires WHERE client_id = X;`

### Issue: "Component shows default values"
- Check if the transformation logic matches what's in the diagnostic script
- Verify the component receives initialData prop correctly
- Ensure useRoomCategories() hook is working
- Check console logs in the ConventionPrix component

### Issue: "Pricing data validation failed"
- Check for invalid price values (negative, zero, NaN)
- Verify month names match exactly (janvier, fevrier, etc.)
- Ensure defaultPrice is a valid number

## Integration with ConventionPrix Component

The component should:

1. **Load room categories** using `useRoomCategories()` hook
2. **Receive initialData** prop with the CategoryPricing[] format
3. **Initialize pricing data** based on initialData or create defaults
4. **Render** monthly pricing grids for each category
5. **Validate** that at least one category has a valid default price

If the diagnostic script passes but the component still shows issues:
- Check the initialData prop is being passed correctly
- Verify the transformation logic matches the diagnostic script
- Check console logs for React/component-specific errors
- Ensure the ref methods (getPricingData, validateData) work correctly

## Example Workflow

1. **Create test data:**
   ```bash
   npm run create-test-convention
   ```

2. **Run diagnostic:**
   ```bash
   npm run diagnose:convention-prix 30
   ```

3. **Check results:**
   - All validation should pass ✅
   - Component compatibility should be confirmed ✅
   - UI preview should show realistic pricing data

4. **Test in actual component:**
   - Use the client ID (30) in your application
   - Navigate to convention editing
   - Verify the ConventionPrix component displays the pricing correctly

This diagnostic approach helps isolate whether issues are in:
- **Data fetching** (database, API)
- **Data transformation** (business logic)  
- **Component rendering** (React, UI)
- **Data validation** (business rules)