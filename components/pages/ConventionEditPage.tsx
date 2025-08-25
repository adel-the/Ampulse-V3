"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ConventionPrix, Hotel, OperateurSocial } from '../../types';
import { 
  Euro, 
  Percent, 
  Calendar, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  ArrowLeft,
  Save,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ConventionEditPageProps {
  convention: ConventionPrix;
  hotel: Hotel | undefined;
  operateur: OperateurSocial | undefined;
  onBack: () => void;
  onSave: (convention: ConventionPrix) => void;
}

interface TypeChambrePrix {
  type: string;
  prixStandard: number;
  prixConventionne: number;
  reduction: number;
  tarifsMensuels?: any;
}

interface ConventionFormData {
  dateDebut: string;
  dateFin: string;
  statut: 'active' | 'expiree' | 'suspendue';
  conditions: string;
  conditionsSpeciales: string;
}

export default function ConventionEditPage({ convention, hotel, operateur, onBack, onSave }: ConventionEditPageProps) {
  const [formData, setFormData] = useState<ConventionFormData>({
    dateDebut: convention.dateDebut,
    dateFin: convention.dateFin || '',
    statut: convention.statut as 'active' | 'suspendue' | 'expiree',
    conditions: convention.conditions || '',
    conditionsSpeciales: convention.conditionsSpeciales || ''
  });

  const [typesChambres, setTypesChambres] = useState<TypeChambrePrix[]>([
    {
      type: 'Simple',
      prixStandard: convention.typeChambre === 'Simple' ? convention.prixStandard : 50,
      prixConventionne: convention.typeChambre === 'Simple' ? convention.prixConventionne : 45,
      reduction: convention.typeChambre === 'Simple' ? convention.reduction : 10,
      tarifsMensuels: convention.tarifsMensuels || {}
    },
    {
      type: 'Double',
      prixStandard: convention.typeChambre === 'Double' ? convention.prixStandard : 70,
      prixConventionne: convention.typeChambre === 'Double' ? convention.prixConventionne : 63,
      reduction: convention.typeChambre === 'Double' ? convention.reduction : 10,
      tarifsMensuels: convention.tarifsMensuels || {}
    },
    {
      type: 'Familiale',
      prixStandard: convention.typeChambre === 'Familiale' ? convention.prixStandard : 90,
      prixConventionne: convention.typeChambre === 'Familiale' ? convention.prixConventionne : 81,
      reduction: convention.typeChambre === 'Familiale' ? convention.reduction : 10,
      tarifsMensuels: convention.tarifsMensuels || {}
    },
    {
      type: 'Adaptée',
      prixStandard: convention.typeChambre === 'Adaptée' ? convention.prixStandard : 80,
      prixConventionne: convention.typeChambre === 'Adaptée' ? convention.prixConventionne : 72,
      reduction: convention.typeChambre === 'Adaptée' ? convention.reduction : 10,
      tarifsMensuels: convention.tarifsMensuels || {}
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handlePrixStandardChange = (index: number, value: number) => {
    const newTypes = [...typesChambres];
    newTypes[index].prixStandard = value;
    newTypes[index].prixConventionne = Math.round(value * (1 - newTypes[index].reduction / 100));
    setTypesChambres(newTypes);
  };

  const handleReductionChange = (index: number, value: number) => {
    const newTypes = [...typesChambres];
    newTypes[index].reduction = value;
    newTypes[index].prixConventionne = Math.round(newTypes[index].prixStandard * (1 - value / 100));
    setTypesChambres(newTypes);
  };

  const handlePrixConventionneChange = (index: number, value: number) => {
    const newTypes = [...typesChambres];
    newTypes[index].prixConventionne = value;
    newTypes[index].reduction = Math.round(((newTypes[index].prixStandard - value) / newTypes[index].prixStandard) * 100);
    setTypesChambres(newTypes);
  };

  // Gestion des tarifs mensuels
  const handleTarifMensuelChange = (index: number, mois: string, type: 'prixParPersonne' | 'prixParChambre', valeur: number) => {
    const newTypes = [...typesChambres];
    const tarifsMensuels = newTypes[index].tarifsMensuels || {};
    const tarifsMois = tarifsMensuels[mois] || {};
    
    newTypes[index].tarifsMensuels = {
      ...tarifsMensuels,
      [mois]: {
        ...tarifsMois,
        [type]: valeur
      }
    };
    setTypesChambres(newTypes);
  };

  const MOIS = [
    { key: 'janvier', nom: 'Janvier' },
    { key: 'fevrier', nom: 'Février' },
    { key: 'mars', nom: 'Mars' },
    { key: 'avril', nom: 'Avril' },
    { key: 'mai', nom: 'Mai' },
    { key: 'juin', nom: 'Juin' },
    { key: 'juillet', nom: 'Juillet' },
    { key: 'aout', nom: 'Août' },
    { key: 'septembre', nom: 'Septembre' },
    { key: 'octobre', nom: 'Octobre' },
    { key: 'novembre', nom: 'Novembre' },
    { key: 'decembre', nom: 'Décembre' }
  ] as const;

  const handleSave = async () => {
    setIsSaving(true);
    
    // Créer une convention pour chaque type de chambre
    const conventionsToSave = typesChambres.map((typeChambre, index) => ({
      ...convention,
      id: convention.id + index, // Générer des IDs uniques
      typeChambre: typeChambre.type,
      prixStandard: typeChambre.prixStandard,
      prixConventionne: typeChambre.prixConventionne,
      reduction: typeChambre.reduction,
      tarifsMensuels: typeChambre.tarifsMensuels,
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin || undefined,
      statut: (formData.statut as 'active' | 'suspendue' | 'expiree'),
      conditions: formData.conditions || undefined,
      conditionsSpeciales: formData.conditionsSpeciales || undefined
    }));

    // Sauvegarder toutes les conventions
    conventionsToSave.forEach(conv => onSave(conv));
    
    setIsSaving(false);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiree': return 'bg-red-100 text-red-800';
      case 'suspendue': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSavings = typesChambres.reduce((sum, type) => sum + (type.prixStandard - type.prixConventionne), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier la convention</h1>
            <p className="text-gray-600">
              {hotel?.nom || convention.hotelNom} - {operateur ? `${operateur.prenom} ${operateur.nom}` : 'Opérateur'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(formData.statut)}>
            {formData.statut === 'active' ? 'Active' : formData.statut === 'suspendue' ? 'Suspendue' : 'Expirée'}
          </Badge>
        </div>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateFin">Date de fin (optionnel)</Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'active' | 'expiree' | 'suspendue' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="active">Active</option>
                <option value="suspendue">Suspendue</option>
                <option value="expiree">Expirée</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="conditions">Conditions générales</Label>
            <textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              placeholder="Ex: Réservation minimum 3 nuits, paiement à l'avance requis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="conditionsSpeciales">Conditions spéciales (mode tarification)</Label>
            <textarea
              id="conditionsSpeciales"
              value={formData.conditionsSpeciales}
              onChange={(e) => setFormData({ ...formData, conditionsSpeciales: e.target.value })}
              placeholder="Ex: Mode par personne - Max 2 personnes, Mode par mois - Min 3 mois..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prix par type de chambre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Euro className="h-5 w-5 mr-2" />
              Prix par type de chambre
            </div>
            <div className="text-sm text-gray-600">
              Économies totales: <span className="font-medium text-green-600">{totalSavings}€</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typesChambres.map((typeChambre, index) => (
              <div key={typeChambre.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{typeChambre.type}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Économie: {typeChambre.prixStandard - typeChambre.prixConventionne}€
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      -{typeChambre.reduction}%
                    </Badge>
                  </div>
                </div>
                
                {/* Tarifs mensuels */}
                <div className="mb-4">
                  <Label className="text-base font-medium mb-4 block">Tarifs mensuels</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOIS.map(({ key, nom }) => (
                      <Card key={key} className="p-4">
                        <div className="text-sm font-medium mb-3 text-gray-700">{nom}</div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Prix par personne (€)</Label>
                            <Input
                              type="number"
                              value={typeChambre.tarifsMensuels?.[key]?.prixParPersonne || ''}
                              onChange={(e) => handleTarifMensuelChange(index, key, 'prixParPersonne', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prix par chambre (€)</Label>
                            <Input
                              type="number"
                              value={typeChambre.tarifsMensuels?.[key]?.prixParChambre || ''}
                              onChange={(e) => handleTarifMensuelChange(index, key, 'prixParChambre', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Prix de base */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`prixStandard-${index}`}>Prix standard (€)</Label>
                    <Input
                      id={`prixStandard-${index}`}
                      type="number"
                      value={typeChambre.prixStandard}
                      onChange={(e) => handlePrixStandardChange(index, Number(e.target.value))}
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`reduction-${index}`}>Réduction (%)</Label>
                    <Input
                      id={`reduction-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      value={typeChambre.reduction}
                      onChange={(e) => handleReductionChange(index, Number(e.target.value))}
                      placeholder="10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`prixConventionne-${index}`}>Prix conventionné (€)</Label>
                    <div className="flex items-center">
                      <Input
                        id={`prixConventionne-${index}`}
                        type="number"
                        value={typeChambre.prixConventionne}
                        onChange={(e) => handlePrixConventionneChange(index, Number(e.target.value))}
                        placeholder="45"
                        className="bg-gray-50"
                      />
                      <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    </div>
                  </div>
                </div>


                {typeChambre.reduction > 0 && (
                  <div className="mt-3 bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center text-green-800">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Économie de {typeChambre.prixStandard - typeChambre.prixConventionne}€ par nuit 
                        ({typeChambre.reduction}% de réduction)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la convention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{typesChambres.length}</div>
              <div className="text-sm text-gray-600">Types de chambres</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalSavings}€</div>
              <div className="text-sm text-gray-600">Économies totales</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(typesChambres.reduce((sum, type) => sum + type.reduction, 0) / typesChambres.length)}%
              </div>
              <div className="text-sm text-gray-600">Réduction moyenne</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {typesChambres.filter(type => type.reduction > 0).length}
              </div>
              <div className="text-sm text-gray-600">Conventions actives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onBack}>
          <XCircle className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
} 
