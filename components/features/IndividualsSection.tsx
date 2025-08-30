'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users, Plus, ChevronDown, ChevronUp, Crown, User, TestTube, Shuffle, Info, Loader2
} from 'lucide-react';
import { Individual, createEmptyIndividual } from '@/types/individuals';
import IndividualCard from '../ui/individual-card';
import IndividualForm from '../ui/individual-form';
import { testDataGenerator } from '@/lib/testDataGenerator';
import { useNotifications } from '@/hooks/useNotifications';
import { useIndividus } from '@/hooks/useIndividus';
import { 
  individuRowsToIndividuals, 
  individualToIndividuInsert,
  individualToIndividuUpdate
} from '@/lib/individuAdapter';
import { migrateIndividualsToDatabase } from '@/lib/individualsMigrationUtil';

interface IndividualsSectionProps {
  usagerId?: number; // ID de l'usager pour lequel gérer les individus
  mainUsagerData?: {
    nom?: string;
    lieu_naissance?: string;
    telephone?: string;
    email?: string;
  };
  className?: string;
  enableTestData?: boolean;
  onTestDataGenerated?: (individuals: Individual[]) => void;
  // Props de compatibilité (optionnelles maintenant)
  individuals?: Individual[];
  onUpdateIndividuals?: (individuals: Individual[]) => void;
}

export default function IndividualsSection({
  usagerId,
  individuals: propIndividuals = [],
  onUpdateIndividuals,
  mainUsagerData,
  className = "",
  enableTestData = false,
  onTestDataGenerated
}: IndividualsSectionProps) {
  // Hooks pour la gestion BDD des individus
  const individusBDD = useIndividus(usagerId);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  
  // États UI locaux
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  const [showTestDataOptions, setShowTestDataOptions] = useState(false);
  
  const { addNotification } = useNotifications();

  // Migration automatique localStorage → BDD au montage
  useEffect(() => {
    if (!usagerId || migrationCompleted) return;

    const performMigration = async () => {
      try {
        const result = await migrateIndividualsToDatabase(usagerId, individusBDD);
        
        if (result.success && result.migratedCount > 0) {
          addNotification('success', `${result.migratedCount} individu(s) migré(s) vers la base de données`);
        }
        
        setMigrationCompleted(true);
      } catch (error) {
        console.error('Migration error:', error);
        addNotification('error', 'Erreur lors de la migration des données');
        setMigrationCompleted(true); // Continue malgré l'erreur
      }
    };

    performMigration();
  }, [usagerId, migrationCompleted, individusBDD, addNotification]);

  // Déterminer la source de données : BDD si usagerId fourni, sinon props
  const individuals = usagerId 
    ? individuRowsToIndividuals(individusBDD.individus) 
    : propIndividuals;
  
  // Déterminr si on affiche le loader
  const isLoading = usagerId ? individusBDD.loading && !migrationCompleted : false;

  // Mettre à jour l'expansion quand les données changent
  useEffect(() => {
    setIsExpanded(individuals.length > 0);
  }, [individuals.length]);

  // Séparer le responsable des autres individus
  const responsible = individuals.find(ind => ind.isChefFamille);
  const otherIndividuals = individuals.filter(ind => !ind.isChefFamille);

  const handleAddIndividual = useCallback(async (newIndividualData: Omit<Individual, 'id'>) => {
    if (usagerId) {
      // Mode BDD : utiliser les hooks
      const insertData = individualToIndividuInsert(newIndividualData, usagerId);
      const result = await individusBDD.createIndividu(insertData);
      
      if (result.success) {
        addNotification('success', 'Individu ajouté avec succès');
        setShowAddForm(false);
      } else {
        addNotification('error', result.error || 'Erreur lors de l\'ajout');
      }
    } else {
      // Mode compatibilité : utiliser les props
      const newIndividual: Individual = {
        ...newIndividualData,
        id: crypto.randomUUID(),
        isChefFamille: false
      };
      
      onUpdateIndividuals?.([...individuals, newIndividual]);
      setShowAddForm(false);
    }
  }, [usagerId, individusBDD, addNotification, individuals, onUpdateIndividuals]);

  const handleUpdateIndividual = useCallback(async (id: string, updates: Omit<Individual, 'id'>) => {
    if (usagerId) {
      // Mode BDD : utiliser les hooks
      const numericId = parseInt(id);
      if (isNaN(numericId)) return;

      const updateData = individualToIndividuUpdate({ ...updates, id });
      const result = await individusBDD.updateIndividu(numericId, updateData);
      
      if (result.success) {
        addNotification('success', 'Individu mis à jour avec succès');
        setEditingId(null);
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } else {
      // Mode compatibilité : utiliser les props
      const updatedIndividuals = individuals.map(ind => 
        ind.id === id ? { ...ind, ...updates, id } : ind
      );
      onUpdateIndividuals?.(updatedIndividuals);
      setEditingId(null);
    }
  }, [usagerId, individusBDD, addNotification, individuals, onUpdateIndividuals]);

  const handleRemoveIndividual = useCallback(async (id: string) => {
    // Vérification supplémentaire pour éviter de supprimer le responsable
    const individual = individuals.find(ind => ind.id === id);
    if (individual?.isChefFamille) {
      addNotification('warning', 'Impossible de supprimer le responsable principal');
      return;
    }
    
    if (usagerId) {
      // Mode BDD : utiliser les hooks
      const numericId = parseInt(id);
      if (isNaN(numericId)) return;

      const result = await individusBDD.deleteIndividu(numericId);
      
      if (result.success) {
        addNotification('success', 'Individu supprimé avec succès');
        setEditingId(null);
      } else {
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } else {
      // Mode compatibilité : utiliser les props
      onUpdateIndividuals?.(individuals.filter(ind => ind.id !== id));
      setEditingId(null);
    }
  }, [usagerId, individusBDD, addNotification, individuals, onUpdateIndividuals]);

  const handleSetAsResponsible = useCallback(async (id: string) => {
    if (usagerId) {
      // Mode BDD : utiliser les hooks
      const numericId = parseInt(id);
      if (isNaN(numericId)) return;

      const result = await individusBDD.setChefFamille(numericId);
      
      if (result.success) {
        addNotification('success', 'Nouveau responsable principal défini');
      } else {
        addNotification('error', result.error || 'Erreur lors de la définition du responsable');
      }
    } else {
      // Mode compatibilité : utiliser les props
      const updatedIndividuals = individuals.map(ind => ({
        ...ind,
        isChefFamille: ind.id === id
      }));
      onUpdateIndividuals?.(updatedIndividuals);
    }
  }, [usagerId, individusBDD, addNotification, individuals, onUpdateIndividuals]);

  const handleStartEdit = useCallback((id: string) => {
    setEditingId(id);
    setShowAddForm(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleStartAdd = useCallback(() => {
    setShowAddForm(true);
    setEditingId(null);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const handleGenerateTestData = useCallback(async (replaceExisting: boolean = false, scenarioType: 'random' | 'next' | string = 'random') => {
    if (isGeneratingTestData) return;
    
    try {
      setIsGeneratingTestData(true);
      
      // Simulate some loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let newIndividuals: Individual[];
      
      if (scenarioType === 'random') {
        newIndividuals = testDataGenerator.generateRandomScenario();
      } else if (scenarioType === 'next') {
        newIndividuals = testDataGenerator.getNextScenario();
      } else {
        newIndividuals = testDataGenerator.generateSpecificScenario(scenarioType);
      }
      
      if (usagerId) {
        // Mode BDD : utiliser les hooks
        if (replaceExisting) {
          // TODO: Implémenter la suppression de tous les individus existants puis insertion
          // Pour l'instant, on ajoute seulement
          console.warn('Replace existing not implemented for DB mode, adding instead');
        }

        // Convertir et insérer en batch
        const individuInserts = newIndividuals.map(ind => 
          individualToIndividuInsert(ind, usagerId)
        );
        
        const result = await individusBDD.createIndividusBatch(individuInserts);
        
        if (result.success) {
          onTestDataGenerated?.(newIndividuals);
          
          // Expand the section to show the new data
          setIsExpanded(true);
          
          // Close options panel
          setShowTestDataOptions(false);
          
          // Show success notification
          addNotification(
            'success', 
            `${newIndividuals.length} personne${newIndividuals.length > 1 ? 's' : ''} générée${newIndividuals.length > 1 ? 's' : ''} avec succès`
          );
        } else {
          throw new Error(result.error || 'Erreur lors de la génération');
        }
      } else {
        // Mode compatibilité : utiliser les props
        const finalIndividuals = replaceExisting 
          ? newIndividuals 
          : [...individuals, ...newIndividuals];
        
        onUpdateIndividuals?.(finalIndividuals);
        onTestDataGenerated?.(newIndividuals);
        
        // Expand the section to show the new data
        setIsExpanded(true);
        
        // Close options panel
        setShowTestDataOptions(false);
        
        // Show success notification
        const action = replaceExisting ? 'remplacées' : 'ajoutées';
        addNotification(
          'success', 
          `${newIndividuals.length} personne${newIndividuals.length > 1 ? 's' : ''} ${action} avec succès`
        );
      }
      
    } catch (error) {
      console.error('Error generating test data:', error);
      addNotification('error', 'Erreur lors de la génération des données de test');
    } finally {
      setIsGeneratingTestData(false);
    }
  }, [usagerId, individusBDD, individuals, onUpdateIndividuals, onTestDataGenerated, addNotification, isGeneratingTestData]);

  const handleToggleTestDataOptions = useCallback(() => {
    setShowTestDataOptions(!showTestDataOptions);
    // Close add form when opening test data options
    if (!showTestDataOptions) {
      setShowAddForm(false);
      setEditingId(null);
    }
  }, [showTestDataOptions]);

  const totalCount = individuals.length;
  const otherCount = otherIndividuals.length;

  return (
    <Card className={`mb-4 ${className}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Personnes liées à l'usager</span>
            {isLoading ? (
              <Badge variant="secondary" className="ml-2">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Chargement...
              </Badge>
            ) : (
              totalCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalCount === 1 ? '1 personne' : `${totalCount} personnes`}
                </Badge>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            {usagerId && individusBDD.error && (
              <span className="text-xs text-red-500 mr-2">
                Erreur BDD
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </CardTitle>
        {!isExpanded && totalCount > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            {responsible && (
              <span>Responsable: {responsible.prenom} {responsible.nom}</span>
            )}
            {otherCount > 0 && (
              <span className="ml-2">
                + {otherCount} autre{otherCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Responsable principal */}
          {responsible && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Responsable principal
                </span>
              </div>
              <IndividualCard
                individual={responsible}
                isEditing={editingId === responsible.id}
                onEdit={() => handleStartEdit(responsible.id)}
                onUpdate={(updates) => handleUpdateIndividual(responsible.id, updates)}
                onRemove={() => handleRemoveIndividual(responsible.id)}
                onCancelEdit={handleCancelEdit}
                canBeResponsible={false} // Ne peut pas changer de responsable depuis lui-même
                autoFillFromMain={mainUsagerData}
              />
            </div>
          )}

          {/* Autres personnes */}
          {otherCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Autres personnes ({otherCount})
                </span>
              </div>
              <div className="space-y-3">
                {otherIndividuals.map(individual => (
                  <IndividualCard
                    key={individual.id}
                    individual={individual}
                    isEditing={editingId === individual.id}
                    onEdit={() => handleStartEdit(individual.id)}
                    onUpdate={(updates) => handleUpdateIndividual(individual.id, updates)}
                    onRemove={() => handleRemoveIndividual(individual.id)}
                    onSetAsResponsible={() => handleSetAsResponsible(individual.id)}
                    onCancelEdit={handleCancelEdit}
                    canBeResponsible={true}
                    autoFillFromMain={mainUsagerData}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
              <CardContent className="pt-4">
                <div className="mb-3">
                  <h4 className="font-medium text-blue-900">Ajouter une nouvelle personne</h4>
                  <p className="text-sm text-blue-700">
                    Les informations communes seront pré-remplies automatiquement
                  </p>
                </div>
                <IndividualForm
                  onSubmit={handleAddIndividual}
                  onCancel={handleCancelAdd}
                  autoFillFromMain={mainUsagerData}
                  isMainContact={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Boutons d'action */}
          {!showAddForm && editingId === null && !showTestDataOptions && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleStartAdd}
                className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une personne
              </Button>
              
              {enableTestData && (
                <Button
                  variant="outline"
                  onClick={handleToggleTestDataOptions}
                  className="w-full border-dashed border-2 border-amber-300 hover:border-amber-400 hover:bg-amber-50 transition-colors py-2 text-amber-700"
                  title="Générer des données de test réalistes"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Générer des données de test
                </Button>
              )}
            </div>
          )}
          
          {/* Options de génération de données de test */}
          {showTestDataOptions && enableTestData && (
            <Card className="border-dashed border-2 border-amber-300 bg-amber-50">
              <CardContent className="pt-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube className="h-4 w-4 text-amber-700" />
                    <h4 className="font-medium text-amber-900">Générer des données de test</h4>
                  </div>
                  <div className="flex items-start gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Génère automatiquement des familles françaises réalistes avec des relations cohérentes, 
                      des âges appropriés et des informations de contact variées.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Boutons de génération rapide */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateTestData(false, 'random')}
                      disabled={isGeneratingTestData}
                      className="text-xs"
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      {isGeneratingTestData ? 'Génération...' : 'Ajouter famille'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateTestData(true, 'random')}
                      disabled={isGeneratingTestData}
                      className="text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      {isGeneratingTestData ? 'Génération...' : 'Remplacer tout'}
                    </Button>
                  </div>
                  
                  {/* Scénarios disponibles */}
                  <div>
                    <p className="text-xs font-medium text-amber-800 mb-2">Scénarios disponibles :</p>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {testDataGenerator.getAvailableScenarios().map((scenario, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateTestData(false, scenario.name)}
                          disabled={isGeneratingTestData}
                          className="justify-start h-auto py-1 px-2 text-xs text-amber-700 hover:bg-amber-100"
                          title={scenario.description}
                        >
                          • {scenario.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTestDataOptions(false)}
                      className="text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message si aucune personne */}
          {totalCount === 0 && !showAddForm && !showTestDataOptions && (
            <div className="text-center py-6 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucune personne ajoutée</p>
              <p className="text-xs text-gray-400 mt-1">
                {enableTestData 
                  ? 'Ajoutez manuellement ou générez des données de test pour commencer'
                  : 'Cliquez sur "Ajouter une personne" pour commencer'
                }
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}