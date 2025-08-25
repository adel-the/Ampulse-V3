'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, ToggleLeft, ToggleRight, Building2, MapPin, Phone, Mail, User, Users } from 'lucide-react';
import type { Establishment } from '@/lib/api/establishments';

interface EstablishmentCardProps {
  establishment: Establishment;
  onEdit: (establishment: Establishment) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  isLoading?: boolean;
}

export default function EstablishmentCard({
  establishment,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading = false
}: EstablishmentCardProps) {
  const isActive = establishment.statut === 'ACTIF';
  const occupancyRate = establishment.chambres_total > 0 
    ? Math.round((establishment.chambres_occupees / establishment.chambres_total) * 100)
    : 0;

  const handleEdit = () => {
    onEdit(establishment);
  };

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'établissement "${establishment.nom}" ?`)) {
      onDelete(establishment.id);
    }
  };

  const handleToggleStatus = () => {
    onToggleStatus(establishment.id);
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {establishment.nom}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {establishment.statut}
                </Badge>
                {establishment.type_etablissement && (
                  <Badge variant="outline" className="text-xs">
                    {establishment.type_etablissement}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              disabled={isLoading}
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleStatus}
              disabled={isLoading}
              title={isActive ? 'Désactiver' : 'Activer'}
            >
              {isActive ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isLoading}
              title="Supprimer"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Adresse */}
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <div>{establishment.adresse}</div>
            <div>{establishment.code_postal} {establishment.ville}</div>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {establishment.telephone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{establishment.telephone}</span>
            </div>
          )}
          {establishment.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{establishment.email}</span>
            </div>
          )}
        </div>

        {/* Gestionnaire */}
        {establishment.gestionnaire && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              <span className="font-medium">Gestionnaire:</span> {establishment.gestionnaire}
            </span>
          </div>
        )}

        {/* Statistiques des chambres */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Occupation</span>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {establishment.chambres_occupees}/{establishment.chambres_total}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Taux d'occupation</span>
            <span className="text-sm font-semibold text-gray-900">{occupancyRate}%</span>
          </div>
        </div>

        {/* Informations supplémentaires */}
        {(establishment.siret || establishment.classement_etoiles) && (
          <div className="border-t pt-3 space-y-1">
            {establishment.siret && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">SIRET:</span> {establishment.siret}
              </div>
            )}
            {establishment.classement_etoiles && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Classement:</span> {establishment.classement_etoiles} étoile{establishment.classement_etoiles > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}