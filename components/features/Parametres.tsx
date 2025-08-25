"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Users, 
  Building2, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Save,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Shield,
  Bell,
  Palette,
  Database
} from 'lucide-react';
import ModificationHistory from './ModificationHistory';

interface ParametresProps {
  features: {
    operateursSociaux: boolean;
  
    statistiques: boolean;
    notifications: boolean;
  };
  selectedHotel?: number | null;
  hotels?: Array<{ id: number; nom: string }>;
  reservations?: Array<{ id: number; numero: string; usager: string; hotel: string }>;
  agents?: Array<{ id: number; nom: string; prenom: string; role: string }>;
  onFeatureToggle: (feature: string, enabled: boolean) => void;
  onHotelSelect: (hotelId: number | null) => void;
  onSaveSettings: () => void;
  onResetSettings: () => void;
}

export default function Parametres({ 
  features, 
  selectedHotel,
  hotels = [],
  reservations = [],
  agents = [],
  onFeatureToggle, 
  onHotelSelect,
  onSaveSettings, 
  onResetSettings 
}: ParametresProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (feature: string, enabled: boolean) => {
    onFeatureToggle(feature, enabled);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveSettings();
    setHasChanges(false);
  };

  const handleReset = () => {
    onResetSettings();
    setHasChanges(false);
  };

  const featuresList = [
    {
      key: 'operateursSociaux',
      title: 'Opérateurs sociaux',
      description: 'Gestion des prescripteurs et accompagnateurs sociaux',
      icon: Users,
      category: 'Fonctionnalités principales'
    },

    {
      key: 'statistiques',
      title: 'Statistiques avancées',
      description: 'Tableaux de bord et rapports détaillés',
      icon: BarChart3,
      category: 'Analytics'
    },
    {
      key: 'notifications',
      title: 'Notifications système',
      description: 'Alertes et notifications en temps réel',
      icon: Bell,
      category: 'Communication'
    }
  ];

  const categories = Array.from(new Set(featuresList.map(f => f.category)));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Configurez les fonctionnalités de votre application</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Modifications non sauvegardées
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Fonctionnalités par catégorie */}
      {categories.map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuresList
              .filter(feature => feature.category === category)
              .map(feature => {
                const Icon = feature.icon;
                const isEnabled = features[feature.key as keyof typeof features];
                
                return (
                  <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={isEnabled ? "default" : "secondary"}>
                        {isEnabled ? 'Activé' : 'Désactivé'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(feature.key, !isEnabled)}
                        className="flex items-center space-x-2"
                      >
                        {isEnabled ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Désactiver</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Activer</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}

      {/* Sélection d'établissement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Établissement actuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Sélectionnez l'établissement sur lequel vous souhaitez travailler.
            </p>
            <div className="space-y-3">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`hotel-${hotel.id}`}
                    name="hotel-selection"
                    checked={selectedHotel === hotel.id}
                    onChange={() => onHotelSelect(hotel.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor={`hotel-${hotel.id}`} className="text-sm font-medium text-gray-900">
                    {hotel.nom}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {selectedHotel && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Établissement sélectionné :</strong> {hotels.find(h => h.id === selectedHotel)?.nom}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paramètres système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Paramètres système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Version de l'application</h3>
              <p className="text-sm text-gray-600">2.0.0</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Dernière mise à jour</h3>
              <p className="text-sm text-gray-600">15 décembre 2024</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Statut de la base de données</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Connectée</p>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Dernière synchronisation</h3>
              <p className="text-sm text-gray-600">{new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
          
          {/* Informations détaillées sur les mises à jour */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Historique des mises à jour</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Version 2.0.0</span>
                <span className="text-blue-600">15 décembre 2024</span>
              </div>
              <ul className="text-blue-700 ml-4 space-y-1">
                <li>• Amélioration du système de filtres de disponibilité</li>
                <li>• Ajout des états de chambres dans le calendrier</li>
                <li>• Interface utilisateur modernisée</li>
                <li>• Correction de bugs et optimisations</li>
              </ul>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
                <span className="text-blue-800">Version 1.9.0</span>
                <span className="text-blue-600">1 décembre 2024</span>
              </div>
              <ul className="text-blue-700 ml-4 space-y-1">
                <li>• Intégration complète avec Supabase</li>
                <li>• Système de gestion des clients</li>
                <li>• Génération de PDF améliorée</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique de modifications */}
      <ModificationHistory 
        reservations={reservations}
        agents={agents}
      />

      {/* Informations importantes */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Shield className="h-5 w-5 mr-2" />
            Informations importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-yellow-700">
            <p>
              • La désactivation de la fonctionnalité "Opérateurs sociaux" masquera l'onglet correspondant 
              et désactivera toutes les fonctionnalités liées.
            </p>
            <p>
              • Les données existantes ne seront pas supprimées mais ne seront plus accessibles 
              tant que la fonctionnalité n'est pas réactivée.
            </p>
            <p>
              • Certaines fonctionnalités peuvent dépendre d'autres. La désactivation d'une fonctionnalité 
              peut affecter le comportement d'autres modules.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
