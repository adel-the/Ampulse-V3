"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { CheckCircle, AlertCircle, Plus, Trash2, User, Building, Heart, Calculator, Euro, Users, Calendar, ArrowLeft } from 'lucide-react';
import { OperateurSocial, ConventionPrix, TarifsMensuels } from '../../types';

interface EditOperateurPageProps {
  operateur: OperateurSocial;
  onSave: (operateur: OperateurSocial, conventions: ConventionPrix[]) => void;
  onCancel: () => void;
}

const CATEGORIES_CHAMBRES = [
  { id: 'standard', nom: 'Standard', prixBase: 45 },
  { id: 'confort', nom: 'Confort', prixBase: 65 },
  { id: 'superieure', nom: 'Supérieure', prixBase: 85 },
  { id: 'suite', nom: 'Suite', prixBase: 120 },
  { id: 'adaptee', nom: 'Adaptée PMR', prixBase: 55 }
];

const SECTEURS_ACTIVITE = [
  'Santé / Social',
  'Éducation / Formation',
  'Commerce / Vente',
  'Industrie / Production',
  'Services / Conseil',
  'Administration publique',
  'Associations / ONG',
  'Autre'
];

const STATUTS_JURIDIQUES = [
  'SARL', 'SAS', 'SA', 'EURL', 'Auto-entrepreneur',
  'Association loi 1901', 'Fondation', 'Coopérative', 'Autre'
];

const EditOperateurPage: React.FC<EditOperateurPageProps> = ({ operateur, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [activeConventionTab, setActiveConventionTab] = useState('dynamique');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Données du formulaire
  const [formData, setFormData] = useState({
    nom: operateur.nom || '',
    prenom: operateur.prenom || '',
    organisation: operateur.organisation || '',
    email: operateur.email || '',
    telephone: operateur.telephone || '',
    statut: operateur.statut || 'actif',
    specialite: operateur.specialite || '',
    zone_intervention: operateur.zoneIntervention || '',
    notes: operateur.notes || ''
  });

  const [conventionsPrix, setConventionsPrix] = useState<ConventionPrix[]>([]);

  // Constante pour les mois
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

  // Gestion des conventions de prix dynamiques
  const ajouterConventionPrix = () => {
    const nouvelleConvention: ConventionPrix = {
      id: Date.now(),
      operateurId: operateur.id,
      hotelId: 1, // À remplacer par la sélection d'hôtel
      hotelNom: '',
      typeChambre: 'standard',
      prixConventionne: 45,
      prixStandard: 50,
      reduction: 10,
      dateDebut: new Date().toISOString().split('T')[0],
      statut: 'active',
      conditions: '',
      conditionsSpeciales: '',
      tarifsMensuels: {}
    };
    setConventionsPrix(prev => [...prev, nouvelleConvention]);
  };

  const modifierConventionPrix = (index: number, champ: string, valeur: any) => {
    setConventionsPrix(prev => prev.map((conv, i) =>
      i === index ? { ...conv, [champ]: valeur } : conv
    ));
  };

  const supprimerConventionPrix = (index: number) => {
    setConventionsPrix(prev => prev.filter((_, i) => i !== index));
  };

  // Gestion des tarifs mensuels
  const modifierTarifMensuel = (conventionIndex: number, mois: string, type: 'prixParPersonne' | 'prixParChambre', valeur: number) => {
    setConventionsPrix(prev => prev.map((convention, index) => {
      if (index === conventionIndex) {
        const tarifsMensuels = convention.tarifsMensuels || {};
        const tarifsMois = (tarifsMensuels as any)[mois] || {};

        return {
          ...convention,
          tarifsMensuels: {
            ...tarifsMensuels,
            [mois]: {
              ...tarifsMois,
              [type]: valeur
            }
          }
        };
      }
      return convention;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation basique
      if (!formData.nom.trim() || !formData.prenom.trim() || !formData.organisation.trim()) {
        throw new Error('Le nom, prénom et l\'organisation sont obligatoires');
      }

      // Préparer les données mises à jour
      const operateurMisAJour: OperateurSocial = {
        ...operateur,
        ...formData
      };

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(operateurMisAJour, conventionsPrix);
      setSuccess('Opérateur mis à jour avec succès !');

    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Messages d'état */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erreur:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Succès:</strong> {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>Modifier l'opérateur</span>
            </CardTitle>
            <Button variant="outline" onClick={onCancel} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Informations générales</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="agrement">Agrément</TabsTrigger>
                <TabsTrigger value="conventions">Conventions tarifaires</TabsTrigger>
              </TabsList>

              {/* Onglet Informations générales */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organisation">Organisation *</Label>
                    <Input
                      id="organisation"
                      value={formData.organisation}
                      onChange={(e) => setFormData(prev => ({ ...prev, organisation: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialite">Spécialité</Label>
                    <Input
                      id="specialite"
                      value={formData.specialite}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialite: e.target.value }))}
                      placeholder="Ex: Accompagnement social"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone_intervention">Zone d'intervention</Label>
                    <Input
                      id="zone_intervention"
                      value={formData.zone_intervention}
                      onChange={(e) => setFormData(prev => ({ ...prev, zone_intervention: e.target.value }))}
                      placeholder="Ex: Paris et banlieue"
                    />
                  </div>
                </div>



                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </TabsContent>

              {/* Onglet Contact */}
              <TabsContent value="contact" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <select
                      id="statut"
                      value={formData.statut}
                      onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as 'actif' | 'inactif' }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Agrément */}
              <TabsContent value="agrement" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                </div>
              </TabsContent>

                             {/* Onglet Conventions tarifaires */}
               <TabsContent value="conventions" className="space-y-6">
                 <div className="flex items-center space-x-2 mb-4">
                   <Calculator className="h-5 w-5 text-blue-600" />
                   <h3 className="text-lg font-semibold">Conventions tarifaires</h3>
                 </div>

                 {/* Onglets principaux pour les types de tarification */}
                 <Tabs defaultValue="pax" className="w-full">
                   <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="pax">Prix par personne ou PAX</TabsTrigger>
                     <TabsTrigger value="chambres">Prix par typologie de chambre</TabsTrigger>
                   </TabsList>

                   {/* Onglet Prix par personne ou PAX */}
                   <TabsContent value="pax" className="space-y-6">
                     <div className="flex justify-between items-center">
                       <div>
                         <h3 className="text-lg font-semibold">Tarifs par personne (PAX)</h3>
                         <p className="text-sm text-gray-600">Définissez les tarifs par personne pour chaque mois</p>
                       </div>
                       <Button type="button" onClick={ajouterConventionPrix} className="flex items-center space-x-2">
                         <Plus className="h-4 w-4" />
                         <span>Ajouter un tarif PAX</span>
                       </Button>
                     </div>

                     {conventionsPrix.length === 0 && (
                       <Card className="p-8 text-center">
                         <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                         <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tarif PAX</h3>
                         <p className="text-gray-600">Ajoutez des tarifs par personne pour personnaliser les prix</p>
                       </Card>
                     )}

                     {conventionsPrix.map((convention, index) => (
                       <Card key={index}>
                         <CardHeader className="flex flex-row items-center justify-between">
                           <CardTitle className="text-base">Tarif PAX #{index + 1}</CardTitle>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => supprimerConventionPrix(index)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </CardHeader>
                         <CardContent className="space-y-6">
                           {/* Informations de base */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <Label>Prix standard par personne (€)</Label>
                               <Input
                                 type="number"
                                 value={convention.prixStandard}
                                 onChange={(e) => modifierConventionPrix(index, 'prixStandard', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                             <div>
                               <Label>Prix conventionné par personne (€)</Label>
                               <Input
                                 type="number"
                                 value={convention.prixConventionne}
                                 onChange={(e) => modifierConventionPrix(index, 'prixConventionne', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                           </div>

                           {/* Tarifs mensuels pour PAX */}
                           <div>
                             <Label className="text-base font-medium mb-4 block">Tarifs mensuels par personne</Label>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {MOIS.map(({ key, nom }) => (
                                 <Card key={key} className="p-4">
                                   <div className="text-sm font-medium mb-3 text-gray-700">{nom}</div>
                                   <div className="space-y-2">
                                     <div>
                                       <Label className="text-xs">Prix par personne (€)</Label>
                                       <Input
                                         type="number"
                                         value={convention.tarifsMensuels?.[key]?.prixParPersonne || ''}
                                         onChange={(e) => modifierTarifMensuel(index, key, 'prixParPersonne', parseFloat(e.target.value) || 0)}
                                         placeholder="0"
                                         className="text-sm"
                                       />
                                     </div>
                                   </div>
                                 </Card>
                               ))}
                             </div>
                           </div>

                           {/* Conditions spéciales */}
                           <div>
                             <Label>Conditions spéciales</Label>
                             <Textarea
                               value={convention.conditionsSpeciales || ''}
                               onChange={(e) => modifierConventionPrix(index, 'conditionsSpeciales', e.target.value)}
                               rows={2}
                               placeholder="Conditions particulières pour les tarifs PAX..."
                             />
                           </div>

                           {/* Résumé de la réduction */}
                           <div className="text-center p-3 bg-blue-50 rounded-md">
                             <div className="text-sm font-medium text-blue-800">
                               Réduction : {convention.reduction}%
                             </div>
                             <div className="text-xs text-blue-600">
                               Économie : {(convention.prixStandard - convention.prixConventionne).toFixed(0)}€ par personne
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </TabsContent>

                   {/* Onglet Prix par typologie de chambre */}
                   <TabsContent value="chambres" className="space-y-6">
                     <div className="flex justify-between items-center">
                       <div>
                         <h3 className="text-lg font-semibold">Tarifs par typologie de chambre</h3>
                         <p className="text-sm text-gray-600">Définissez les tarifs par type de chambre pour chaque mois</p>
                       </div>
                       <Button type="button" onClick={ajouterConventionPrix} className="flex items-center space-x-2">
                         <Plus className="h-4 w-4" />
                         <span>Ajouter un tarif chambre</span>
                       </Button>
                     </div>

                     {conventionsPrix.length === 0 && (
                       <Card className="p-8 text-center">
                         <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                         <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tarif chambre</h3>
                         <p className="text-gray-600">Ajoutez des tarifs par type de chambre pour personnaliser les prix</p>
                       </Card>
                     )}

                     {conventionsPrix.map((convention, index) => (
                       <Card key={index}>
                         <CardHeader className="flex flex-row items-center justify-between">
                           <CardTitle className="text-base">Tarif chambre par jour pour le mois sélectionné #{index + 1}</CardTitle>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => supprimerConventionPrix(index)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </CardHeader>
                         <CardContent className="space-y-6">
                           {/* Informations de base */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                               <Label>Type de chambre</Label>
                               <select
                                 value={convention.typeChambre}
                                 onChange={(e) => modifierConventionPrix(index, 'typeChambre', e.target.value)}
                                 className="w-full p-2 border border-gray-300 rounded-md"
                               >
                                 <option value="standard">Standard</option>
                                 <option value="confort">Confort</option>
                                 <option value="superieure">Supérieure</option>
                                 <option value="suite">Suite</option>
                                 <option value="adaptee">Adaptée PMR</option>
                               </select>
                             </div>
                             <div>
                               <Label>Prix standard par chambre (€)</Label>
                               <Input
                                 type="number"
                                 value={convention.prixStandard}
                                 onChange={(e) => modifierConventionPrix(index, 'prixStandard', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                             <div>
                               <Label>Prix conventionné par chambre (€)</Label>
                               <Input
                                 type="number"
                                 value={convention.prixConventionne}
                                 onChange={(e) => modifierConventionPrix(index, 'prixConventionne', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                           </div>

                           {/* Tarifs mensuels pour chambres */}
                           <div>
                             <Label className="text-base font-medium mb-4 block">Tarifs mensuels par chambre</Label>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {MOIS.map(({ key, nom }) => (
                                 <Card key={key} className="p-4">
                                   <div className="text-sm font-medium mb-3 text-gray-700">{nom}</div>
                                   <div className="space-y-2">
                                     <div>
                                       <Label className="text-xs">Prix par chambre (€)</Label>
                                       <Input
                                         type="number"
                                         value={convention.tarifsMensuels?.[key]?.prixParChambre || ''}
                                         onChange={(e) => modifierTarifMensuel(index, key, 'prixParChambre', parseFloat(e.target.value) || 0)}
                                         placeholder="0"
                                         className="text-sm"
                                       />
                                     </div>
                                   </div>
                                 </Card>
                               ))}
                             </div>
                           </div>

                           {/* Conditions spéciales */}
                           <div>
                             <Label>Conditions spéciales</Label>
                             <Textarea
                               value={convention.conditionsSpeciales || ''}
                               onChange={(e) => modifierConventionPrix(index, 'conditionsSpeciales', e.target.value)}
                               rows={2}
                               placeholder="Conditions particulières pour les tarifs chambre..."
                             />
                           </div>

                           {/* Résumé de la réduction */}
                           <div className="text-center p-3 bg-blue-50 rounded-md">
                             <div className="text-sm font-medium text-blue-800">
                               Réduction : {convention.reduction}%
                             </div>
                             <div className="text-xs text-blue-600">
                               Économie : {(convention.prixStandard - convention.prixConventionne).toFixed(0)}€ par chambre
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </TabsContent>
                 </Tabs>
               </TabsContent>
            </Tabs>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? 'Mise à jour...' : 'Mettre à jour l\'opérateur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditOperateurPage; 