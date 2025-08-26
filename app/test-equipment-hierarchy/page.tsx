'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEstablishments } from '@/hooks/useSupabase';
import HotelEquipmentManagement from '@/components/features/HotelEquipmentManagement';

export default function TestEquipmentHierarchy() {
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const { establishments, loading } = useEstablishments();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des établissements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test - Hiérarchie des Équipements</h1>
        <p className="text-gray-600 mt-2">
          Cette page permet de tester la nouvelle hiérarchie des équipements où les équipements appartiennent d'abord aux hôtels.
        </p>
      </div>

      {establishments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Aucun établissement trouvé.</p>
              <p className="text-sm mt-1">Vous devez d'abord créer un hôtel pour tester la gestion des équipements.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hotel Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un Hôtel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.map(hotel => (
                  <div
                    key={hotel.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedHotelId === hotel.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedHotelId(hotel.id)}
                  >
                    <h3 className="font-medium text-gray-900">{hotel.nom}</h3>
                    <p className="text-sm text-gray-600 mt-1">{hotel.ville}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {hotel.chambres_total || 0} chambres
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        hotel.statut === 'ACTIF' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hotel.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedHotelId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Hôtel sélectionné: <strong>{establishments.find(h => h.id === selectedHotelId)?.nom}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Management */}
          {selectedHotelId && (
            <HotelEquipmentManagement
              hotelId={selectedHotelId}
              hotelName={establishments.find(h => h.id === selectedHotelId)?.nom || 'Hôtel sélectionné'}
            />
          )}
        </>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">1. Sélection d'hôtel</h4>
              <p>Cliquez sur un hôtel ci-dessus pour sélectionner l'établissement.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">2. Gestion des équipements</h4>
              <p>Ajoutez des équipements à l'hôtel. Seuls ces équipements seront disponibles pour les chambres de cet hôtel.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">3. Configuration</h4>
              <p>Pour chaque équipement, vous pouvez définir s'il est gratuit ou payant, ajouter des conditions d'usage, etc.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">4. Test des chambres</h4>
              <p>
                Allez ensuite dans la gestion des chambres et créez/modifiez une chambre. 
                Vous ne verrez que les équipements configurés pour cet hôtel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}