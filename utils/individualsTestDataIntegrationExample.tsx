// Integration Example: How to use the Individuals Test Data Generator in React components
// This file shows practical usage examples for development and testing

import React, { useState } from 'react';
import { 
  generateVariedIndividualsTestData, 
  generateNuclearFamily,
  generateSingleParentFamily,
  generateExtendedFamily,
  PREDEFINED_FAMILIES 
} from './individualsTestDataGenerator';
import { Individual } from '../types/individuals';

// Example 1: Button to populate form with test data
interface TestDataButtonProps {
  onDataGenerated: (individuals: Individual[]) => void;
  variant?: 'random' | 'nuclear' | 'single_parent' | 'extended' | 'predefined';
}

export function TestDataButton({ onDataGenerated, variant = 'random' }: TestDataButtonProps) {
  const generateTestData = () => {
    let testData: Individual[];
    
    switch (variant) {
      case 'nuclear':
        testData = generateNuclearFamily();
        break;
      case 'single_parent':
        testData = generateSingleParentFamily();
        break;
      case 'extended':
        testData = generateExtendedFamily();
        break;
      case 'predefined':
        // Use one of the predefined families
        testData = PREDEFINED_FAMILIES.famille_martin();
        break;
      default:
        testData = generateVariedIndividualsTestData();
    }
    
    onDataGenerated(testData);
  };

  const buttonLabels = {
    random: 'Générer famille aléatoire',
    nuclear: 'Famille nucléaire',
    single_parent: 'Parent seul',
    extended: 'Famille élargie',
    predefined: 'Famille prédéfinie'
  };

  return (
    <button 
      onClick={generateTestData}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      type="button"
    >
      {buttonLabels[variant]}
    </button>
  );
}

// Example 2: Development panel with multiple test data options
export function IndividualsTestDataPanel() {
  const [generatedData, setGeneratedData] = useState<Individual[]>([]);
  const [stats, setStats] = useState<{ totalGenerated: number; lastGenerated: string }>({
    totalGenerated: 0,
    lastGenerated: 'Aucun'
  });

  const handleDataGenerated = (data: Individual[], type: string) => {
    setGeneratedData(data);
    setStats({
      totalGenerated: data.length,
      lastGenerated: type
    });
  };

  const clearData = () => {
    setGeneratedData([]);
    setStats({ totalGenerated: 0, lastGenerated: 'Aucun' });
  };

  const copyToClipboard = () => {
    const jsonData = JSON.stringify(generatedData, null, 2);
    navigator.clipboard.writeText(jsonData);
    alert('Données copiées dans le presse-papiers!');
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Générateur de données de test - Individus
      </h3>
      
      {/* Generation buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <TestDataButton 
          variant="random" 
          onDataGenerated={(data) => handleDataGenerated(data, 'Aléatoire')} 
        />
        <TestDataButton 
          variant="nuclear" 
          onDataGenerated={(data) => handleDataGenerated(data, 'Nucléaire')} 
        />
        <TestDataButton 
          variant="single_parent" 
          onDataGenerated={(data) => handleDataGenerated(data, 'Parent seul')} 
        />
        <TestDataButton 
          variant="extended" 
          onDataGenerated={(data) => handleDataGenerated(data, 'Élargie')} 
        />
        <TestDataButton 
          variant="predefined" 
          onDataGenerated={(data) => handleDataGenerated(data, 'Prédéfinie')} 
        />
        <button 
          onClick={clearData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Effacer
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded border mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Dernière génération:</span>
            <span className="ml-2 text-blue-600">{stats.lastGenerated}</span>
          </div>
          <div>
            <span className="font-medium">Nombre d'individus:</span>
            <span className="ml-2 text-green-600">{stats.totalGenerated}</span>
          </div>
        </div>
      </div>

      {/* Generated data preview */}
      {generatedData.length > 0 && (
        <div className="bg-white rounded border">
          <div className="p-4 border-b flex justify-between items-center">
            <h4 className="font-medium text-gray-800">Données générées</h4>
            <button 
              onClick={copyToClipboard}
              className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Copier JSON
            </button>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {generatedData.map((individual, index) => (
              <div key={individual.id} className="mb-3 p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-800">
                  {individual.prenom} {individual.nom}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="mr-4">
                    {individual.relation || 'Chef de famille'}
                  </span>
                  {individual.date_naissance && (
                    <span className="mr-4">
                      Né(e) le {new Date(individual.date_naissance).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {individual.lieu_naissance && (
                    <span className="mr-4">à {individual.lieu_naissance}</span>
                  )}
                </div>
                {(individual.telephone || individual.email) && (
                  <div className="text-sm text-gray-500 mt-1">
                    {individual.telephone && (
                      <span className="mr-4">📞 {individual.telephone}</span>
                    )}
                    {individual.email && (
                      <span>📧 {individual.email}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Example 3: Hook for easy integration
export function useIndividualsTestData() {
  const [individuals, setIndividuals] = useState<Individual[]>([]);

  const generateRandomFamily = () => {
    const data = generateVariedIndividualsTestData();
    setIndividuals(data);
    return data;
  };

  const generateSpecificFamily = (type: 'nuclear' | 'single_parent' | 'extended') => {
    let data: Individual[];
    
    switch (type) {
      case 'nuclear':
        data = generateNuclearFamily();
        break;
      case 'single_parent':
        data = generateSingleParentFamily();
        break;
      case 'extended':
        data = generateExtendedFamily();
        break;
    }
    
    setIndividuals(data);
    return data;
  };

  const generatePredefinedFamily = (familyName: keyof typeof PREDEFINED_FAMILIES) => {
    const data = PREDEFINED_FAMILIES[familyName]();
    setIndividuals(data);
    return data;
  };

  const addIndividualsToExisting = (existingIndividuals: Individual[]) => {
    const newFamily = generateVariedIndividualsTestData();
    const combined = [...existingIndividuals, ...newFamily];
    setIndividuals(combined);
    return combined;
  };

  const clearIndividuals = () => {
    setIndividuals([]);
  };

  return {
    individuals,
    generateRandomFamily,
    generateSpecificFamily,
    generatePredefinedFamily,
    addIndividualsToExisting,
    clearIndividuals,
    setIndividuals
  };
}

// Example 4: Utility functions for testing
export const testDataUtils = {
  // Generate batch data for stress testing
  generateBatchFamilies: (count: number = 10): Individual[][] => {
    return Array.from({ length: count }, () => generateVariedIndividualsTestData());
  },

  // Generate all predefined families at once
  generateAllPredefinedFamilies: (): Record<string, Individual[]> => {
    const results: Record<string, Individual[]> = {};
    Object.keys(PREDEFINED_FAMILIES).forEach(key => {
      results[key] = PREDEFINED_FAMILIES[key as keyof typeof PREDEFINED_FAMILIES]();
    });
    return results;
  },

  // Validate generated data matches expected structure
  validateTestData: (individuals: Individual[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    individuals.forEach((individual, index) => {
      if (!individual.id) errors.push(`Individual ${index + 1}: Missing ID`);
      if (!individual.nom?.trim()) errors.push(`Individual ${index + 1}: Missing nom`);
      if (!individual.prenom?.trim()) errors.push(`Individual ${index + 1}: Missing prenom`);
      if (individual.isChefFamille) errors.push(`Individual ${index + 1}: Should not be chef de famille`);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get statistics about generated data
  getDataStatistics: (individuals: Individual[]) => {
    const stats = {
      total: individuals.length,
      byRelation: {} as Record<string, number>,
      byGender: {} as Record<string, number>,
      ageDistribution: {} as Record<string, number>,
      contactInfo: {
        withPhone: individuals.filter(i => i.telephone).length,
        withEmail: individuals.filter(i => i.email).length,
        withBoth: individuals.filter(i => i.telephone && i.email).length
      }
    };

    individuals.forEach(individual => {
      // Relation distribution
      const relation = individual.relation || 'Chef de famille';
      stats.byRelation[relation] = (stats.byRelation[relation] || 0) + 1;

      // Gender distribution
      const gender = individual.sexe || 'Non spécifié';
      stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;

      // Age distribution
      if (individual.date_naissance) {
        const age = new Date().getFullYear() - new Date(individual.date_naissance).getFullYear();
        const ageGroup = age < 18 ? 'Mineur' : age < 65 ? 'Adulte' : 'Senior';
        stats.ageDistribution[ageGroup] = (stats.ageDistribution[ageGroup] || 0) + 1;
      }
    });

    return stats;
  }
};

// Export everything for easy usage
export default {
  TestDataButton,
  IndividualsTestDataPanel,
  useIndividualsTestData,
  testDataUtils
};