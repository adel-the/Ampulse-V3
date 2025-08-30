'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Save, X } from 'lucide-react';
import { Individual, RELATIONS, RelationType, validateIndividual, createEmptyIndividual } from '@/types/individuals';

interface IndividualFormProps {
  individual?: Individual;
  onSubmit: (individual: Omit<Individual, 'id'>) => void;
  onCancel: () => void;
  autoFillFromMain?: {
    nom?: string;
    lieu_naissance?: string;
    telephone?: string;
    email?: string;
  };
  isMainContact?: boolean;
}

export default function IndividualForm({
  individual,
  onSubmit,
  onCancel,
  autoFillFromMain,
  isMainContact = false
}: IndividualFormProps) {
  const [formData, setFormData] = useState<Omit<Individual, 'id'>>(() => {
    if (individual) {
      const { id, ...rest } = individual;
      return rest;
    }
    
    // Pour un nouvel individu, pré-remplir avec les données du chef de famille si disponibles
    const empty = createEmptyIndividual();
    const { id, ...emptyData } = empty;
    
    return {
      ...emptyData,
      nom: autoFillFromMain?.nom || '',
      lieu_naissance: autoFillFromMain?.lieu_naissance || '',
      telephone: autoFillFromMain?.telephone || '',
      email: autoFillFromMain?.email || '',
      isChefFamille: isMainContact
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create individual object for validation
    const individualForValidation: Individual = {
      id: crypto.randomUUID(),
      ...formData
    };
    
    const validationErrors = validateIndividual(individualForValidation);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Nom, Prénom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => handleInputChange('nom', e.target.value.toUpperCase())}
            className={`text-sm ${errors.nom ? 'border-red-500' : ''}`}
            placeholder="NOM DE FAMILLE"
            required
          />
          {errors.nom && <p className="text-xs text-red-600 mt-1">{errors.nom}</p>}
        </div>
        <div>
          <Label htmlFor="prenom">Prénom *</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => handleInputChange('prenom', e.target.value)}
            className={`text-sm ${errors.prenom ? 'border-red-500' : ''}`}
            placeholder="Prénom"
            required
          />
          {errors.prenom && <p className="text-xs text-red-600 mt-1">{errors.prenom}</p>}
        </div>
      </div>

      {/* Row 2: Date naissance, Lieu naissance, Sexe */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date_naissance">Date de naissance</Label>
          <Input
            id="date_naissance"
            type="date"
            value={formData.date_naissance}
            onChange={(e) => handleInputChange('date_naissance', e.target.value)}
            className={`text-sm ${errors.date_naissance ? 'border-red-500' : ''}`}
          />
          {errors.date_naissance && <p className="text-xs text-red-600 mt-1">{errors.date_naissance}</p>}
        </div>
        <div>
          <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
          <Input
            id="lieu_naissance"
            value={formData.lieu_naissance}
            onChange={(e) => handleInputChange('lieu_naissance', e.target.value)}
            className={`text-sm ${errors.lieu_naissance ? 'border-red-500' : ''}`}
            placeholder="Ville"
          />
          {errors.lieu_naissance && <p className="text-xs text-red-600 mt-1">{errors.lieu_naissance}</p>}
        </div>
        <div>
          <Label htmlFor="sexe">Sexe</Label>
          <select
            id="sexe"
            value={formData.sexe || ''}
            onChange={(e) => handleInputChange('sexe', e.target.value || undefined)}
            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sexe ? 'border-red-500' : ''
            }`}
          >
            <option value="">Non spécifié</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="Autre">Autre</option>
          </select>
          {errors.sexe && <p className="text-xs text-red-600 mt-1">{errors.sexe}</p>}
        </div>
      </div>

      {/* Row 3: Téléphone, Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            type="tel"
            value={formData.telephone}
            onChange={(e) => handleInputChange('telephone', e.target.value)}
            className="text-sm"
            placeholder="06 12 34 56 78"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="text-sm"
            placeholder="prenom@email.fr"
          />
        </div>
      </div>

      {/* Row 4: Relation (seulement si pas chef de famille) */}
      {!isMainContact && (
        <div>
          <Label htmlFor="relation">Lien avec le responsable</Label>
          <select
            id="relation"
            value={formData.relation || ''}
            onChange={(e) => handleInputChange('relation', (e.target.value || undefined) as RelationType)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner la relation</option>
            {RELATIONS.map(relation => (
              <option key={relation} value={relation}>{relation}</option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          size="sm"
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Annuler
        </Button>
        <Button 
          type="submit" 
          size="sm"
          disabled={!formData.nom || !formData.prenom}
          className="flex items-center gap-1"
        >
          <Save className="h-3 w-3" />
          {individual ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}