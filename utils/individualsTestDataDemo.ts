// Demo and testing file for the Individuals Test Data Generator
// This file demonstrates how to use the generator and validates the output

import { 
  generateIndividualsTestData,
  generateVariedIndividualsTestData,
  generateNuclearFamily,
  generateSingleParentFamily,
  generateExtendedFamily,
  PREDEFINED_FAMILIES,
  FAMILY_SCENARIOS
} from './individualsTestDataGenerator';
import { validateIndividual, formatAge } from '../types/individuals';

// Demo function to show all available generators
export function demonstrateGenerators() {
  console.log('=== INDIVIDUALS TEST DATA GENERATOR DEMO ===\n');

  // 1. Random scenario generation
  console.log('1. RANDOM SCENARIO GENERATION:');
  const randomFamily = generateIndividualsTestData();
  console.log(`Generated family with ${randomFamily.length} members:`);
  randomFamily.forEach((person, index) => {
    console.log(`  ${index + 1}. ${person.prenom} ${person.nom} (${person.relation || 'Chef de famille'})`);
    console.log(`     Age: ${formatAge(person.date_naissance)} | Né(e) à: ${person.lieu_naissance}`);
    console.log(`     Contact: ${person.telephone || 'N/A'} | ${person.email || 'N/A'}\n`);
  });

  // 2. Varied generation with rotation
  console.log('2. VARIED GENERATION (with rotation):');
  for (let i = 0; i < 3; i++) {
    const variedFamily = generateVariedIndividualsTestData();
    console.log(`Family ${i + 1}: ${variedFamily[0].nom} (${variedFamily.length} membres)`);
  }
  console.log();

  // 3. Specific scenario generators
  console.log('3. SPECIFIC SCENARIO GENERATORS:');
  
  console.log('Nuclear Family:');
  const nuclearFamily = generateNuclearFamily();
  nuclearFamily.forEach(person => {
    console.log(`  - ${person.prenom} ${person.nom} (${person.relation})`);
  });
  
  console.log('\nSingle Parent Family:');
  const singleParentFamily = generateSingleParentFamily();
  singleParentFamily.forEach(person => {
    console.log(`  - ${person.prenom} ${person.nom} (${person.relation})`);
  });
  
  console.log('\nExtended Family:');
  const extendedFamily = generateExtendedFamily();
  extendedFamily.forEach(person => {
    console.log(`  - ${person.prenom} ${person.nom} (${person.relation})`);
  });

  // 4. Predefined families
  console.log('\n4. PREDEFINED FAMILIES:');
  Object.keys(PREDEFINED_FAMILIES).forEach(familyKey => {
    const family = PREDEFINED_FAMILIES[familyKey as keyof typeof PREDEFINED_FAMILIES]();
    console.log(`${familyKey}: ${family[0].nom} family (${family.length} membres)`);
  });

  // 5. Available scenarios
  console.log('\n5. AVAILABLE FAMILY SCENARIOS:');
  FAMILY_SCENARIOS.forEach((scenario, index) => {
    console.log(`  ${index + 1}. ${scenario.type}: ${scenario.description}`);
  });
}

// Validation function to ensure generated data is valid
export function validateGeneratedData() {
  console.log('\n=== DATA VALIDATION ===\n');
  
  const testCases = [
    { name: 'Random Generation', generator: generateIndividualsTestData },
    { name: 'Nuclear Family', generator: generateNuclearFamily },
    { name: 'Single Parent', generator: generateSingleParentFamily },
    { name: 'Extended Family', generator: generateExtendedFamily }
  ];

  testCases.forEach(testCase => {
    console.log(`Testing: ${testCase.name}`);
    const individuals = testCase.generator();
    
    let allValid = true;
    individuals.forEach((individual, index) => {
      const errors = validateIndividual(individual);
      const hasErrors = Object.keys(errors).length > 0;
      
      if (hasErrors) {
        console.log(`  ❌ Individual ${index + 1} (${individual.prenom}) has errors:`, errors);
        allValid = false;
      }
    });
    
    if (allValid) {
      console.log(`  ✅ All ${individuals.length} individuals are valid`);
    }
    
    // Check data completeness
    const withPhone = individuals.filter(p => p.telephone).length;
    const withEmail = individuals.filter(p => p.email).length;
    const withBirthPlace = individuals.filter(p => p.lieu_naissance).length;
    
    console.log(`  📊 Data completeness:`);
    console.log(`     Phone: ${withPhone}/${individuals.length} (${Math.round(withPhone/individuals.length*100)}%)`);
    console.log(`     Email: ${withEmail}/${individuals.length} (${Math.round(withEmail/individuals.length*100)}%)`);
    console.log(`     Birth Place: ${withBirthPlace}/${individuals.length} (${Math.round(withBirthPlace/individuals.length*100)}%)`);
    console.log();
  });
}

// Performance test
export function performanceTest() {
  console.log('\n=== PERFORMANCE TEST ===\n');
  
  const iterations = 1000;
  
  console.log(`Generating ${iterations} random families...`);
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    generateIndividualsTestData();
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / iterations;
  
  console.log(`✅ Generated ${iterations} families in ${totalTime.toFixed(2)}ms`);
  console.log(`📊 Average time per family: ${averageTime.toFixed(2)}ms`);
  console.log(`🚀 Rate: ${Math.round(1000 / averageTime)} families/second`);
}

// Data analysis function
export function analyzeGeneratedData() {
  console.log('\n=== DATA ANALYSIS ===\n');
  
  const sampleSize = 100;
  const allIndividuals: any[] = [];
  
  // Collect sample data
  for (let i = 0; i < sampleSize; i++) {
    allIndividuals.push(...generateIndividualsTestData());
  }
  
  // Analyze relationships
  const relationCounts: Record<string, number> = {};
  allIndividuals.forEach(person => {
    const relation = person.relation || 'Chef de famille';
    relationCounts[relation] = (relationCounts[relation] || 0) + 1;
  });
  
  console.log('📊 RELATIONSHIP DISTRIBUTION:');
  Object.entries(relationCounts).forEach(([relation, count]) => {
    const percentage = Math.round((count / allIndividuals.length) * 100);
    console.log(`  ${relation}: ${count} (${percentage}%)`);
  });
  
  // Analyze age distribution
  const ages = allIndividuals
    .filter(p => p.date_naissance)
    .map(p => {
      const birthYear = parseInt(p.date_naissance.split('-')[0]);
      return new Date().getFullYear() - birthYear;
    });
  
  const ageRanges = {
    '0-12': ages.filter(age => age <= 12).length,
    '13-17': ages.filter(age => age >= 13 && age <= 17).length,
    '18-30': ages.filter(age => age >= 18 && age <= 30).length,
    '31-50': ages.filter(age => age >= 31 && age <= 50).length,
    '51-70': ages.filter(age => age >= 51 && age <= 70).length,
    '70+': ages.filter(age => age > 70).length
  };
  
  console.log('\n📊 AGE DISTRIBUTION:');
  Object.entries(ageRanges).forEach(([range, count]) => {
    const percentage = Math.round((count / ages.length) * 100);
    console.log(`  ${range} ans: ${count} (${percentage}%)`);
  });
  
  // Gender distribution
  const genderCounts = {
    'M': allIndividuals.filter(p => p.sexe === 'M').length,
    'F': allIndividuals.filter(p => p.sexe === 'F').length,
    'Autre': allIndividuals.filter(p => p.sexe === 'Autre').length
  };
  
  console.log('\n📊 GENDER DISTRIBUTION:');
  Object.entries(genderCounts).forEach(([gender, count]) => {
    const percentage = Math.round((count / allIndividuals.length) * 100);
    console.log(`  ${gender}: ${count} (${percentage}%)`);
  });
}

// Run all demonstrations
export function runFullDemo() {
  demonstrateGenerators();
  validateGeneratedData();
  performanceTest();
  analyzeGeneratedData();
}

// Export for use in other files
export default {
  demonstrateGenerators,
  validateGeneratedData,
  performanceTest,
  analyzeGeneratedData,
  runFullDemo
};