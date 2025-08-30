# Individuals Test Data Generator

Comprehensive test data generator for the individuals management system in the hotel PMS. Generates realistic French family/individual data with proper relationships, ages, and contact information.

## Features

- **Realistic French Data**: Uses authentic French names, cities, and cultural patterns
- **Family Scenarios**: 8 different family configurations (nuclear, single-parent, extended, etc.)
- **Varied Data Sets**: Different results each time with rotation logic
- **Proper Relationships**: Age-appropriate family relationships
- **Contact Variation**: Mix of complete and partial contact information
- **Validation Ready**: All generated data passes existing validation rules

## Quick Start

```typescript
import { generateVariedIndividualsTestData } from '@/utils/individualsTestDataGenerator';

// Generate a random family scenario
const family = generateVariedIndividualsTestData();
console.log(`Generated ${family.length} family members`);
```

## Available Generators

### 1. Main Generators

```typescript
// Random scenario with rotation logic (recommended)
const family = generateVariedIndividualsTestData();

// Pure random scenario
const randomFamily = generateIndividualsTestData();
```

### 2. Specific Family Types

```typescript
// Nuclear family (2 parents + 2 children)
const nuclear = generateNuclearFamily();

// Single parent + teenager
const singleParent = generateSingleParentFamily();

// Extended family with grandparent
const extended = generateExtendedFamily();
```

### 3. Predefined Families

```typescript
// Consistent test data for specific scenarios
const martinFamily = PREDEFINED_FAMILIES.famille_martin();
const dupontGroup = PREDEFINED_FAMILIES.groupe_dupont();
const bernardCouple = PREDEFINED_FAMILIES.couple_bernard();
const laurentSiblings = PREDEFINED_FAMILIES.fratrie_laurent();
```

## Family Scenarios

The generator includes 8 different family configurations:

| Scenario | Description | Members | Use Case |
|----------|-------------|---------|----------|
| `nuclear_family` | Classic family with 2 children | Spouse + 2 children | Standard family bookings |
| `single_parent` | Single parent with teenager | 1 teenager | Single parent scenarios |
| `couple_no_children` | Adult couple without kids | Spouse only | Couple getaways |
| `extended_family` | Three generations | Spouse + child + grandparent | Multi-generational stays |
| `sibling_group` | Brothers and sisters | 3 siblings | Adult sibling groups |
| `large_family` | Family with 3+ children | Spouse + 3 children | Large family bookings |
| `mixed_relationships` | Friends, roommates | 2 friends | Non-family groups |
| `three_generation` | Parents + child + grandparent | 3 generations | Complex family units |

## Data Structure

Each generated Individual matches the existing interface:

```typescript
{
  id: string                    // Unique UUID
  nom: string                   // French family name
  prenom: string               // French first name (gender-appropriate)
  date_naissance?: string      // YYYY-MM-DD format
  lieu_naissance?: string      // French city
  sexe?: 'M' | 'F' | 'Autre'  // Gender
  telephone?: string           // French phone format (0X XXXXXXXX)
  email?: string              // Realistic French email
  relation?: RelationType      // Family relationship
  isChefFamille: boolean      // Always false (chef = main user)
}
```

## Data Quality

### Realistic French Names
- **Male names**: Pierre, Jean, Michel, Philippe, Alain, Nicolas, Thomas, Lucas, etc.
- **Female names**: Marie, Christine, Sophie, Anne, Emma, Louise, Chloé, Camille, etc.
- **Family names**: Martin, Bernard, Dupont, Dubois, Laurent, Simon, etc.

### French Birth Cities
50+ realistic French cities including:
- Major cities: Paris, Lyon, Marseille, Toulouse, Nice
- Regional centers: Nantes, Strasbourg, Bordeaux, Lille
- Smaller cities: Reims, Angers, Clermont-Ferrand, etc.

### Contact Information Variation
- **Phone numbers**: Realistic French formats (01/02/03/04/05/06/07/09)
- **Email providers**: gmail.com, outlook.fr, yahoo.fr, orange.fr, free.fr
- **Probability-based**: Realistic mix of complete/incomplete profiles

## Usage Examples

### Integration with Forms

```typescript
import { generateVariedIndividualsTestData } from '@/utils/individualsTestDataGenerator';

// In a test or demo component
function populateFormWithTestData() {
  const testFamily = generateVariedIndividualsTestData();
  
  // Add to existing individuals array
  setIndividuals(prev => [...prev, ...testFamily]);
  
  // Or replace existing data
  setIndividuals(testFamily);
}
```

### Testing Scenarios

```typescript
// Test different family sizes
const smallFamily = generateSingleParentFamily(); // 1 person
const mediumFamily = generateNuclearFamily();     // 3 people  
const largeFamily = generateExtendedFamily();     // 3+ people

// Test age distributions
const families = Array.from({ length: 10 }, () => generateVariedIndividualsTestData());
const allAges = families.flat().map(p => calculateAge(p.date_naissance));
```

### Development Utilities

```typescript
// Quick demo of all capabilities
import { runFullDemo } from '@/utils/individualsTestDataDemo';
runFullDemo(); // Console output with stats and validation

// Performance testing
import { performanceTest } from '@/utils/individualsTestDataDemo';
performanceTest(); // Measures generation speed

// Data quality analysis
import { analyzeGeneratedData } from '@/utils/individualsTestDataDemo';
analyzeGeneratedData(); // Shows distribution stats
```

## Validation & Quality

All generated data automatically passes existing validation:

- **Required fields**: `nom` and `prenom` always provided
- **Date validation**: Birth dates are realistic (not future, not >120 years)
- **Age appropriateness**: Children have child names, adults have adult relationships
- **Family consistency**: Same family name for all members
- **Contact realism**: Phone/email patterns match French standards

## Performance

- **Speed**: ~2000+ families/second on modern hardware
- **Memory**: Lightweight, no persistent state
- **Uniqueness**: Each call generates different data
- **Consistency**: Predefined families return identical data

## Customization

### Adding New Names

```typescript
// Extend the name arrays in individualsTestDataGenerator.ts
const CUSTOM_MALE_NAMES = [...FRENCH_MALE_NAMES, 'Custom', 'Names'];
```

### New Family Scenarios

```typescript
// Add to FAMILY_SCENARIOS array
{
  type: 'custom_scenario',
  description: 'Your custom family type',
  members: [
    { relation: 'Conjoint', ageRange: [25, 35], contactProbability: 0.8 }
  ]
}
```

### Custom Cities

```typescript
// Extend FRENCH_BIRTH_CITIES array
const CUSTOM_CITIES = [...FRENCH_BIRTH_CITIES, 'YourCity', 'AnotherCity'];
```

## Integration Points

### With Existing Forms
- Import and call generators in form components
- Use with existing `Individual` interface
- Compatible with current validation functions

### With Testing Suites
- Generate consistent test data for unit tests
- Create reproducible integration test scenarios
- Performance benchmarking with large datasets

### With Development Workflow
- Quick form population during development
- Demo data for presentations
- UI testing with realistic French names

## Files

- `individualsTestDataGenerator.ts` - Main generator functions
- `individualsTestDataDemo.ts` - Demonstration and testing utilities
- `INDIVIDUALS_TEST_DATA_README.md` - This documentation

## Best Practices

1. **Use `generateVariedIndividualsTestData()`** for general testing (has rotation logic)
2. **Use predefined families** for consistent test scenarios
3. **Validate generated data** in tests to ensure quality
4. **Consider contact probability** when testing UI with/without contact info
5. **Test with different family sizes** to ensure UI handles all scenarios

## Support

The generator is designed to work seamlessly with the existing individuals management system. All generated data follows French naming conventions and cultural patterns appropriate for social housing hotel contexts.