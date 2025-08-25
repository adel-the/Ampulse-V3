"use client";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ConventionPrix, Hotel, OperateurSocial } from '../../types';
import { Euro, Percent, Calendar, Building2, UserCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

interface ConventionDetailProps {
  convention: ConventionPrix;
  hotel: Hotel | undefined;
  operateur: OperateurSocial | undefined;
  onBack: () => void;
  onEdit: (convention: ConventionPrix) => void;
}

export default function ConventionDetail({ convention, hotel, operateur, onBack, onEdit }: ConventionDetailProps) {
  const getConventionStatusColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiree': return 'bg-red-100 text-red-800';
      case 'suspendue': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getConventionStatusText = (statut: string) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'expiree': return 'Expirée';
      case 'suspendue': return 'Suspendue';
      default: return statut;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Button onClick={() => onEdit(convention)}>
          Modifier
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>{hotel?.nom || convention.hotelNom}</span>
            <Badge className={getConventionStatusColor(convention.statut)}>
              {getConventionStatusText(convention.statut)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Type de chambre</div>
              <div className="font-medium text-gray-900">{convention.typeChambre}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mode de tarification</div>
              <div className="font-medium text-gray-900">
                <Badge variant="outline">
                  Par chambre
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Opérateur social</div>
              <div className="font-medium text-gray-900">{operateur ? `${operateur.prenom} ${operateur.nom}` : convention.operateurId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Prix standard</div>
              <div className="flex items-center font-medium text-gray-900">
                <Euro className="h-4 w-4 mr-1" />{convention.prixStandard}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Prix conventionné</div>
              <div className="flex items-center font-medium text-green-700">
                <Euro className="h-4 w-4 mr-1" />{convention.prixConventionne}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Réduction</div>
              <div className="flex items-center font-medium text-orange-700">
                <Percent className="h-4 w-4 mr-1" />-{convention.reduction}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Période de validité</div>
              <div className="flex items-center font-medium text-gray-900">
                <Calendar className="h-4 w-4 mr-1" />Du {convention.dateDebut}
                {convention.dateFin && <span className="ml-2">au {convention.dateFin}</span>}
              </div>
            </div>
          </div>


          {convention.conditionsSpeciales && (
            <div className="flex items-center mt-4 bg-blue-50 p-3 rounded">
              <AlertTriangle className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm text-blue-800">{convention.conditionsSpeciales}</span>
            </div>
          )}
          {convention.conditions && (
            <div className="flex items-center mt-4 bg-yellow-50 p-3 rounded">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              <span className="text-sm text-yellow-800">{convention.conditions}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
