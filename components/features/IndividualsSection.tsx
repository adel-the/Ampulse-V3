'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users, Plus, ChevronDown, ChevronUp, Crown, User
} from 'lucide-react';
import { Individual, createEmptyIndividual } from '@/types/individuals';
import IndividualCard from '../ui/individual-card';
import IndividualForm from '../ui/individual-form';

interface IndividualsSectionProps {
  individuals: Individual[];
  onUpdateIndividuals: (individuals: Individual[]) => void;
  mainUsagerData?: {
    nom?: string;
    lieu_naissance?: string;
    telephone?: string;
    email?: string;
  };
  className?: string;
}

export default function IndividualsSection({
  individuals,
  onUpdateIndividuals,
  mainUsagerData,
  className = ""
}: IndividualsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(individuals.length > 0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Séparer le responsable des autres individus
  const responsible = individuals.find(ind => ind.isChefFamille);
  const otherIndividuals = individuals.filter(ind => !ind.isChefFamille);

  const handleAddIndividual = useCallback((newIndividualData: Omit<Individual, 'id'>) => {
    const newIndividual: Individual = {
      ...newIndividualData,
      id: crypto.randomUUID(),
      isChefFamille: false // Les individus ajoutés ne peuvent pas être chef de famille
    };
    
    onUpdateIndividuals([...individuals, newIndividual]);
    setShowAddForm(false);
  }, [individuals, onUpdateIndividuals]);

  const handleUpdateIndividual = useCallback((id: string, updates: Omit<Individual, 'id'>) => {
    const updatedIndividuals = individuals.map(ind => 
      ind.id === id ? { ...ind, ...updates, id } : ind
    );
    onUpdateIndividuals(updatedIndividuals);
    setEditingId(null);
  }, [individuals, onUpdateIndividuals]);

  const handleRemoveIndividual = useCallback((id: string) => {
    // Vérification supplémentaire pour éviter de supprimer le responsable
    const individual = individuals.find(ind => ind.id === id);
    if (individual?.isChefFamille) {
      return;
    }
    
    onUpdateIndividuals(individuals.filter(ind => ind.id !== id));
    setEditingId(null);
  }, [individuals, onUpdateIndividuals]);

  const handleSetAsResponsible = useCallback((id: string) => {
    const updatedIndividuals = individuals.map(ind => ({
      ...ind,
      isChefFamille: ind.id === id
    }));
    onUpdateIndividuals(updatedIndividuals);
  }, [individuals, onUpdateIndividuals]);

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
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalCount === 1 ? '1 personne' : `${totalCount} personnes`}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
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

          {/* Bouton d'ajout */}
          {!showAddForm && editingId === null && (
            <Button
              variant="outline"
              onClick={handleStartAdd}
              className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une personne
            </Button>
          )}

          {/* Message si aucune personne */}
          {totalCount === 0 && !showAddForm && (
            <div className="text-center py-6 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucune personne ajoutée</p>
              <p className="text-xs text-gray-400 mt-1">
                Cliquez sur "Ajouter une personne" pour commencer
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}