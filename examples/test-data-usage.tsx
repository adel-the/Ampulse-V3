/**
 * Example usage of the IndividualsSection component with test data functionality
 * This demonstrates how to integrate the test data generator in your application
 */

import React, { useState } from 'react';
import IndividualsSection from '@/components/features/IndividualsSection';
import { Individual } from '@/types/individuals';
import { useNotifications } from '@/hooks/useNotifications';

export default function TestDataDemo() {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const { notifications, addNotification } = useNotifications();
  
  // Mock main usager data for auto-fill functionality
  const mainUsagerData = {
    nom: 'Dupont',
    lieu_naissance: 'Paris',
    telephone: '01 23 45 67 89',
    email: 'contact@example.fr'
  };

  const handleUpdateIndividuals = (newIndividuals: Individual[]) => {
    setIndividuals(newIndividuals);
    console.log('Individuals updated:', newIndividuals);
  };

  const handleTestDataGenerated = (generatedIndividuals: Individual[]) => {
    console.log('Test data generated:', generatedIndividuals);
    addNotification('info', `Generated ${generatedIndividuals.length} test individuals`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Data Generator Demo</h1>
      
      {/* Notifications Display */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-md border ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs opacity-75">{notification.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">How to use the test data generator:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Click "Générer des données de test" to open test data options</li>
          <li>2. Choose "Ajouter famille" to add a random family scenario</li>
          <li>3. Choose "Remplacer tout" to replace existing data with new test data</li>
          <li>4. Click on specific scenarios (e.g., "Jeune couple avec enfant") for targeted test data</li>
          <li>5. Generated data includes realistic French names, relationships, and contact information</li>
        </ul>
      </div>

      {/* IndividualsSection with test data enabled */}
      <IndividualsSection
        individuals={individuals}
        onUpdateIndividuals={handleUpdateIndividuals}
        mainUsagerData={mainUsagerData}
        enableTestData={true}
        onTestDataGenerated={handleTestDataGenerated}
        className="shadow-lg"
      />
      
      {/* Current data display */}
      {individuals.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">
            Current Individuals Data ({individuals.length}):
          </h3>
          <pre className="text-xs text-gray-600 overflow-auto max-h-40">
            {JSON.stringify(individuals, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Integration instructions for existing applications:
 * 
 * 1. Import the enhanced IndividualsSection component
 * 2. Add enableTestData={true} prop to enable test functionality
 * 3. Optionally provide onTestDataGenerated callback for custom handling
 * 4. Ensure useNotifications hook is available in your app context
 * 
 * Example minimal integration:
 * 
 * ```tsx
 * import IndividualsSection from '@/components/features/IndividualsSection';
 * 
 * function MyComponent() {
 *   const [individuals, setIndividuals] = useState([]);
 *   
 *   return (
 *     <IndividualsSection
 *       individuals={individuals}
 *       onUpdateIndividuals={setIndividuals}
 *       enableTestData={true} // Enable test data functionality
 *     />
 *   );
 * }
 * ```
 */