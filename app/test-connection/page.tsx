'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';
import { establishmentsApi } from '@/lib/api/establishments';
import { roomsApi } from '@/lib/api/rooms';
import { equipmentsApi } from '@/lib/api/equipments';

interface TestResult {
  entity: string;
  operation: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; rate: number } | null>(null);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setSummary(null);
    const testResults: TestResult[] = [];

    try {
      // Test Etablissements
      const estRead = await establishmentsApi.getEstablishments();
      testResults.push({
        entity: 'Etablissements',
        operation: 'Lecture',
        success: estRead.success,
        message: estRead.success ? `${estRead.data?.length || 0} etablissements trouves` : estRead.error || 'Erreur',
        data: estRead.data
      });

      if (estRead.data && estRead.data.length > 0) {
        const hotelId = estRead.data[0].id;
        
        // Test Chambres
        const roomsRead = await roomsApi.getRoomsByHotel(hotelId);
        testResults.push({
          entity: 'Chambres',
          operation: 'Lecture',
          success: roomsRead.success,
          message: roomsRead.success ? `${roomsRead.data?.length || 0} chambres trouvees` : roomsRead.error || 'Erreur',
          data: roomsRead.data
        });

        // Test creation chambre
        const newRoom = {
          hotel_id: hotelId,
          numero: 'TEST-' + Date.now(),
          type: 'Simple',
          prix: 100,
          statut: 'disponible' as const,
          floor: 1
        };
        
        const roomCreate = await roomsApi.createRoom(newRoom);
        testResults.push({
          entity: 'Chambres',
          operation: 'Creation',
          success: roomCreate.success,
          message: roomCreate.success ? 'Chambre creee avec succes' : roomCreate.error || 'Erreur',
          data: roomCreate.data
        });

        if (roomCreate.data) {
          // Test mise a jour
          const roomUpdate = await roomsApi.updateRoom(roomCreate.data.id, {
            prix: 150,
            statut: 'maintenance'
          });
          testResults.push({
            entity: 'Chambres',
            operation: 'Mise a jour',
            success: roomUpdate.success,
            message: roomUpdate.success ? 'Chambre mise a jour' : roomUpdate.error || 'Erreur'
          });

          // Test suppression
          const roomDelete = await roomsApi.deleteRoom(roomCreate.data.id);
          testResults.push({
            entity: 'Chambres',
            operation: 'Suppression',
            success: roomDelete.success,
            message: roomDelete.success ? 'Chambre supprimee' : roomDelete.error || 'Erreur'
          });
        }
      }

      // Test Equipements
      const equipRead = await equipmentsApi.getEquipments();
      testResults.push({
        entity: 'Equipements',
        operation: 'Lecture',
        success: equipRead.success,
        message: equipRead.success ? `${equipRead.data?.length || 0} equipements trouves` : equipRead.error || 'Erreur',
        data: equipRead.data
      });

      // Test creation equipement
      const newEquip = {
        nom: 'Test Equipment ' + Date.now(),
        icone: 'Star',
        categorie: 'general' as const,
        est_actif: true
      };
      
      const equipCreate = await equipmentsApi.createEquipment(newEquip);
      testResults.push({
        entity: 'Equipements',
        operation: 'Creation',
        success: equipCreate.success,
        message: equipCreate.success ? 'Equipement cree' : equipCreate.error || 'Erreur',
        data: equipCreate.data
      });

      if (equipCreate.data) {
        // Test mise a jour
        const equipUpdate = await equipmentsApi.updateEquipment(equipCreate.data.id, {
          nom: 'Updated Test Equipment',
          est_actif: false
        });
        testResults.push({
          entity: 'Equipements',
          operation: 'Mise a jour',
          success: equipUpdate.success,
          message: equipUpdate.success ? 'Equipement mis a jour' : equipUpdate.error || 'Erreur'
        });

        // Test suppression
        const equipDelete = await equipmentsApi.deleteEquipment(equipCreate.data.id);
        testResults.push({
          entity: 'Equipements',
          operation: 'Suppression',
          success: equipDelete.success,
          message: equipDelete.success ? 'Equipement supprime' : equipDelete.error || 'Erreur'
        });
      }

    } catch (error) {
      console.error('Erreur lors des tests:', error);
      testResults.push({
        entity: 'Systeme',
        operation: 'Erreur generale',
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    setResults(testResults);
    
    // Calculer le resume
    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;
    const rate = total > 0 ? (passed / total) * 100 : 0;
    setSummary({ total, passed, rate });
    
    setTesting(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test de connexion Frontend-Backend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Ce test verifie que toutes les operations CRUD fonctionnent correctement
            pour les trois entites principales : Etablissements, Chambres et Equipements.
          </p>
          
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="w-full sm:w-auto"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tests en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer les tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resultats des tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <span className="font-medium">{result.entity}</span>
                        <span className="mx-2 text-gray-400">-</span>
                        <span className="text-gray-600">{result.operation}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{result.message}</span>
                      <Badge variant={result.success ? "success" : "destructive"}>
                        {result.success ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{summary.total}</div>
                    <div className="text-gray-600">Tests totaux</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                    <div className="text-gray-600">Reussis</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {summary.rate.toFixed(1)}%
                    </div>
                    <div className="text-gray-600">Taux de reussite</div>
                  </div>
                </div>
                
                {summary.rate === 100 ? (
                  <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-bold">Tous les tests sont passes !</div>
                    <div className="text-sm">Le frontend est correctement connecte au backend.</div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center">
                    <XCircle className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-bold">Certains tests ont echoue</div>
                    <div className="text-sm">Verifiez la connexion et les permissions.</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}