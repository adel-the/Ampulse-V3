"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  AlertTriangle, 
  Wrench, 
  Bed, 
  MapPin, 
  Clock,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface CriticalRoom {
  id: string;
  numero: string;
  type: string;
  etage: number;
  hotel: string;
  ville: string;
  raison: 'maintenance' | 'reparation' | 'nettoyage' | 'inspection' | 'securite';
  priorite: 'critique' | 'urgente' | 'normale';
  date_debut: string;
  date_fin_estimee: string;
  description: string;
  responsable: string;
  telephone: string;
}

// Données de démonstration pour les chambres critiques
const getCriticalRooms = (): CriticalRoom[] => {
  return [
    {
      id: '1',
      numero: '101',
      type: 'Simple',
      etage: 1,
      hotel: 'Résidence Saint-Martin',
      ville: 'Paris',
      raison: 'maintenance',
      priorite: 'critique',
      date_debut: '2024-01-15',
      date_fin_estimee: '2024-01-20',
      description: 'Problème de chauffage - Réparation en cours',
      responsable: 'Jean Dupont',
      telephone: '01 23 45 67 89'
    },
    {
      id: '2',
      numero: '205',
      type: 'Double',
      etage: 2,
      hotel: 'Résidence Saint-Martin',
      ville: 'Paris',
      raison: 'reparation',
      priorite: 'urgente',
      date_debut: '2024-01-16',
      date_fin_estimee: '2024-01-18',
      description: 'Fuite d\'eau dans la salle de bain',
      responsable: 'Marie Martin',
      telephone: '01 98 76 54 32'
    },
    {
      id: '3',
      numero: '312',
      type: 'Suite',
      etage: 3,
      hotel: 'Résidence Saint-Martin',
      ville: 'Paris',
      raison: 'inspection',
      priorite: 'normale',
      date_debut: '2024-01-17',
      date_fin_estimee: '2024-01-17',
      description: 'Inspection de sécurité annuelle',
      responsable: 'Pierre Durand',
      telephone: '01 11 22 33 44'
    },
    {
      id: '4',
      numero: '108',
      type: 'Simple',
      etage: 1,
      hotel: 'Résidence Saint-Martin',
      ville: 'Paris',
      raison: 'nettoyage',
      priorite: 'urgente',
      date_debut: '2024-01-16',
      date_fin_estimee: '2024-01-16',
      description: 'Nettoyage en profondeur après incident',
      responsable: 'Sophie Bernard',
      telephone: '01 55 66 77 88'
    }
  ];
};

interface CriticalRoomsAlertProps {
  maxDisplay?: number;
  showAll?: boolean;
}

export default function CriticalRoomsAlert({ maxDisplay = 3, showAll = false }: CriticalRoomsAlertProps) {
  const [criticalRooms, setCriticalRooms] = useState<CriticalRoom[]>(getCriticalRooms());
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const refreshCriticalRooms = async () => {
    setLoading(true);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCriticalRooms(getCriticalRooms());
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-red-600" />
            <span className="text-sm text-red-600">Chargement des chambres critiques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (criticalRooms.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">Aucune chambre critique à signaler</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedRooms = showAll ? criticalRooms : criticalRooms.slice(0, maxDisplay);
  const hasMore = criticalRooms.length > maxDisplay;

  const getPriorityColor = (room: CriticalRoom) => {
    switch (room.priorite) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgente': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getPriorityIcon = (room: CriticalRoom) => {
    switch (room.priorite) {
      case 'critique': return <XCircle className="h-4 w-4" />;
      case 'urgente': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRaisonIcon = (raison: string) => {
    switch (raison) {
      case 'maintenance': return <Wrench className="h-3 w-3" />;
      case 'reparation': return <Wrench className="h-3 w-3" />;
      case 'nettoyage': return <Bed className="h-3 w-3" />;
      case 'inspection': return <AlertCircle className="h-3 w-3" />;
      case 'securite': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getRaisonText = (raison: string) => {
    switch (raison) {
      case 'maintenance': return 'Maintenance';
      case 'reparation': return 'Réparation';
      case 'nettoyage': return 'Nettoyage';
      case 'inspection': return 'Inspection';
      case 'securite': return 'Sécurité';
      default: return raison;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dateFin: string) => {
    const fin = new Date(dateFin);
    const aujourdHui = new Date();
    const diffTime = fin.getTime() - aujourdHui.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Chambres critiques
            <Badge variant="secondary" className="ml-2 bg-red-200 text-red-800">
              {criticalRooms.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCriticalRooms}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            {hasMore && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                {expanded ? 'Réduire' : 'Voir tout'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {(expanded ? criticalRooms : displayedRooms).map((room) => {
            const joursRestants = getDaysRemaining(room.date_fin_estimee);
            return (
              <div
                key={room.id}
                className={`p-3 rounded-lg border ${getPriorityColor(room)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getPriorityIcon(room)}
                      <span className="font-medium text-sm">
                        Chambre {room.numero} ({room.type})
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {room.priorite.toUpperCase()}
                      </Badge>
                      {joursRestants <= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          EN RETARD
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span>{room.hotel} - Étage {room.etage}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getRaisonIcon(room.raison)}
                        <span>{getRaisonText(room.raison)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span>Fin estimée: {formatDate(room.date_fin_estimee)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {joursRestants > 0 ? `${joursRestants} jour(s) restant(s)` : 'Retard'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Description:</strong> {room.description}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Responsable:</strong> {room.responsable} - {room.telephone}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {hasMore && !expanded && !showAll && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Voir les {criticalRooms.length - maxDisplay} autres chambres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
