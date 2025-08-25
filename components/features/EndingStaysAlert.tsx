"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Phone, 
  MapPin, 
  Bed,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useEndingStays, EndingStay } from '../../hooks/useEndingStays';

interface EndingStaysAlertProps {
  maxDisplay?: number;
  showAll?: boolean;
}

export default function EndingStaysAlert({ maxDisplay = 5, showAll = false }: EndingStaysAlertProps) {
  const { endingStays, loading, error, refreshEndingStays } = useEndingStays();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />
            <span className="text-sm text-orange-600">Chargement des alertes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              Erreur lors du chargement des alertes: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (endingStays.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">Aucune fin de séjour à signaler aujourd'hui</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedStays = showAll ? endingStays : endingStays.slice(0, maxDisplay);
  const hasMore = endingStays.length > maxDisplay;

  const getUrgencyColor = (stay: EndingStay) => {
    if (stay.est_termine) return 'bg-red-100 text-red-800 border-red-200';
    if (stay.jours_restants === 0) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getUrgencyIcon = (stay: EndingStay) => {
    if (stay.est_termine) return <XCircle className="h-4 w-4" />;
    if (stay.jours_restants === 0) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getUrgencyText = (stay: EndingStay) => {
    if (stay.est_termine) return 'Séjour terminé';
    if (stay.jours_restants === 0) return 'Termine aujourd\'hui';
    return `${Math.abs(stay.jours_restants)} jour(s) en retard`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-orange-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Alertes de fin de séjour
            <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800">
              {endingStays.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEndingStays}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            {hasMore && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                {expanded ? 'Réduire' : 'Voir tout'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {(expanded ? endingStays : displayedStays).map((stay) => (
            <div
              key={stay.id}
              className={`p-3 rounded-lg border ${getUrgencyColor(stay)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getUrgencyIcon(stay)}
                    <span className="font-medium text-sm">
                      {stay.usager_prenom} {stay.usager_nom}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getUrgencyText(stay)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Bed className="h-3 w-3 text-gray-500" />
                      <span>Chambre {stay.chambre_numero} ({stay.chambre_type})</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span>{stay.hotel_nom} - {stay.hotel_ville}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span>Départ: {formatDate(stay.date_depart)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span>{stay.usager_telephone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  
                  {stay.notes && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Notes:</strong> {stay.notes}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-sm font-medium">
                    {stay.prix}€
                  </div>
                  <div className="text-xs text-gray-500">
                    {stay.duree} jour(s)
                  </div>
                  <div className="text-xs text-gray-500">
                    {stay.prescripteur}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {hasMore && !expanded && !showAll && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Voir les {endingStays.length - maxDisplay} autres alertes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
