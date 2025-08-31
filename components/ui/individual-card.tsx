'use client';

import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Edit, Trash2, Crown, User, Phone, Mail, 
  Calendar, MapPin, Users
} from 'lucide-react';
import { Individual, formatAge } from '@/types/individuals';
import IndividualForm from './individual-form';

interface IndividualCardProps {
  individual: Individual;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Omit<Individual, 'id'>) => void;
  onRemove: () => void;
  onSetAsResponsible?: () => void;
  onCancelEdit: () => void;
  canBeResponsible?: boolean;
  autoFillFromMain?: {
    nom?: string;
    lieu_naissance?: string;
    telephone?: string;
    email?: string;
  };
  isMainUsager?: boolean;
}

export default function IndividualCard({
  individual,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onSetAsResponsible,
  onCancelEdit,
  canBeResponsible = false,
  autoFillFromMain,
  isMainUsager = false
}: IndividualCardProps) {
  
  // Mode édition - affichage du formulaire
  if (isEditing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <IndividualForm
            individual={individual}
            onSubmit={onUpdate}
            onCancel={onCancelEdit}
            autoFillFromMain={autoFillFromMain}
            isMainContact={individual.isChefFamille}
          />
        </CardContent>
      </Card>
    );
  }

  // Mode affichage
  return (
    <Card className={`hover:shadow-md transition-shadow ${
      individual.isChefFamille ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header avec nom et badges */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                {individual.isChefFamille ? (
                  <Crown className="h-4 w-4 text-yellow-600" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
                <h4 className="font-semibold text-gray-900">
                  {individual.prenom} {individual.nom}
                </h4>
              </div>
              
              <div className="flex gap-1">
                {individual.isChefFamille && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
                    Chef de famille {isMainUsager && '(Usager principal)'}
                  </Badge>
                )}
                {individual.relation && !individual.isChefFamille && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {individual.relation}
                  </Badge>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              {individual.date_naissance && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {formatAge(individual.date_naissance)}
                  </span>
                </div>
              )}
              
              {individual.sexe && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {individual.sexe === 'M' ? 'Masculin' : individual.sexe === 'F' ? 'Féminin' : 'Autre'}
                  </span>
                </div>
              )}
              
              {individual.telephone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{individual.telephone}</span>
                </div>
              )}
              
              {individual.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{individual.email}</span>
                </div>
              )}
              
              {individual.lieu_naissance && (
                <div className="flex items-center gap-1 col-span-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Né(e) à {individual.lieu_naissance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-3">
            {!isMainUsager && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 hover:bg-blue-100"
                title="Modifier"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            
            {!individual.isChefFamille && canBeResponsible && onSetAsResponsible && !isMainUsager && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSetAsResponsible}
                className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                title="Définir comme chef de famille"
              >
                <Crown className="h-3 w-3" />
              </Button>
            )}
            
            {!individual.isChefFamille && !isMainUsager && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}