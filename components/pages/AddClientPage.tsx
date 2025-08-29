"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { CheckCircle, AlertCircle, Plus, Trash2, User, Building, Heart, Calculator, Euro, Users, Calendar } from 'lucide-react';
import { ConventionPrix, TarifsMensuels, CLIENT_TYPES as DB_CLIENT_TYPES, ClientCategory } from '../../types';

interface AddClientPageProps {
  onSuccess?: () => void;
}

interface ConventionPrixForm {
  hotelId: number;
  typeChambre: string;
  prixConventionne: number;
  prixStandard: number;
  reduction: number;
  conditionsSpeciales?: string;
  tarifsMensuels?: TarifsMensuels;
}

// Types et constantes - Align with database types
const CLIENT_TYPES = [
  { id: 'Particulier' as ClientCategory, label: 'Particulier', icon: User },
  { id: 'Entreprise' as ClientCategory, label: 'Entreprise', icon: Building },
  { id: 'Association' as ClientCategory, label: 'Association', icon: Heart }
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

const TYPES_REFERENT = [
  'contact_principal',
  'facturation',
  'juridique',
  'technique'
];

const CATEGORIES_CHAMBRES = [
  { id: 'standard', nom: 'Standard', prixBase: 45 },
  { id: 'confort', nom: 'Confort', prixBase: 65 },
  { id: 'superieure', nom: 'Supérieure', prixBase: 85 },
  { id: 'suite', nom: 'Suite', prixBase: 120 },
  { id: 'adaptee', nom: 'Adaptée PMR', prixBase: 55 }
];

interface Referent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
  types: string[];
}

interface TarificationChambre {
  categorieId: string;
  prixNegocie: number;
  reduction: number;
}



const AddClientPage: React.FC<AddClientPageProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validate CLIENT_TYPES consistency on mount
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const localTypes = CLIENT_TYPES.map(t => t.id);
      const dbTypes = [...DB_CLIENT_TYPES];
      const missingInLocal = dbTypes.filter(t => !localTypes.includes(t));
      const missingInDB = localTypes.filter(t => !dbTypes.includes(t));
      
      if (missingInLocal.length > 0 || missingInDB.length > 0) {
        console.error('CLIENT_TYPES mismatch detected:', { missingInLocal, missingInDB });
      }
    }
  }, []);

  // État pour le filtrage des conventions par type de chambre
  const [filtreTypeChambre, setFiltreTypeChambre] = useState<string>('tous');

  // Données du formulaire
  const [formData, setFormData] = useState({
    // Informations générales
    type: 'Particulier' as ClientCategory,
    nom: '',
    siret: '',
    rna: '',
    statutJuridique: '',
    adresse: '',
    ville: '',
    codePostal: '',
    secteurActivite: '',
    
    // Facturation
    entiteFacturee: '',
    iban: '',
    delaiPaiement: 30,
    contactFacturation: '',
    
    // Notes
    notes: ''
  });

  const [referents, setReferents] = useState<Referent[]>([]);
  const [tarification, setTarification] = useState<TarificationChambre[]>(
    CATEGORIES_CHAMBRES.map(cat => ({
      categorieId: cat.id,
      prixNegocie: cat.prixBase,
      reduction: 0
    }))
  );

  const [conventionsPrix, setConventionsPrix] = useState<ConventionPrixForm[]>([]);

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
    const nouvelleConvention: ConventionPrixForm = {
      hotelId: 1, // À remplacer par la sélection d'hôtel
      typeChambre: 'standard',
      prixConventionne: 45,
      prixStandard: 50,
      reduction: 10,
      conditionsSpeciales: '',
      tarifsMensuels: {}
    };
    setConventionsPrix(prev => [...prev, nouvelleConvention]);
    
    // Réinitialiser le filtre pour afficher toutes les conventions après l'ajout
    setFiltreTypeChambre('tous');
  };

  const modifierConventionPrix = (index: number, champ: string, valeur: any) => {
    setConventionsPrix(prev => {
      const nouvellesConventions = prev.map((conv, i) =>
        i === index ? { ...conv, [champ]: valeur } : conv
      );
      
      // Si on modifie le type de chambre et que le filtre actuel ne correspond plus, le réinitialiser
      if (champ === 'typeChambre' && filtreTypeChambre !== 'tous' && filtreTypeChambre !== valeur) {
        const ancienType = prev[index].typeChambre;
        const plusDAncienType = !nouvellesConventions.some(c => c.typeChambre === ancienType);
        
        if (plusDAncienType) {
          setFiltreTypeChambre('tous');
        }
      }
      
      return nouvellesConventions;
    });
  };

  const supprimerConventionPrix = (index: number) => {
    setConventionsPrix(prev => {
      const nouvellesConventions = prev.filter((_, i) => i !== index);
      
      // Si le filtre actuel ne correspond plus à aucune convention, le réinitialiser
      if (filtreTypeChambre !== 'tous' && !nouvellesConventions.some(c => c.typeChambre === filtreTypeChambre)) {
        setFiltreTypeChambre('tous');
      }
      
      return nouvellesConventions;
    });
  };

  // Gestion des tarifs mensuels
  const modifierTarifMensuel = (conventionIndex: number, mois: string, type: 'prixParPersonne' | 'prixParChambre', valeur: number) => {
    setConventionsPrix(prev => prev.map((convention, index) => {
      if (index === conventionIndex) {
        const tarifsMensuels = convention.tarifsMensuels || {};
        const tarifsMois = tarifsMensuels[mois as keyof TarifsMensuels] || {};

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

  // Fonction pour filtrer et trier les conventions par type de chambre
  const conventionsFiltrees = conventionsPrix
    .filter(convention => {
      if (filtreTypeChambre === 'tous') return true;
      return convention.typeChambre === filtreTypeChambre;
    })
    .sort((a, b) => {
      // Ordre de priorité des types de chambres
      const ordreTypes = ['standard', 'confort', 'superieure', 'suite', 'adaptee'];
      const indexA = ordreTypes.indexOf(a.typeChambre);
      const indexB = ordreTypes.indexOf(b.typeChambre);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return a.typeChambre.localeCompare(b.typeChambre);
    });

  // Fonction pour obtenir les types de chambres uniques
  const typesChambresUniques = Array.from(new Set(conventionsPrix.map(c => c.typeChambre)));

  // Gestion des référents
  const ajouterReferent = () => {
    const nouvelId = `ref_${Date.now()}`;
    setReferents(prev => [...prev, {
      id: nouvelId,
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      fonction: '',
      types: ['contact_principal']
    }]);
  };

  const supprimerReferent = (id: string) => {
    setReferents(prev => prev.filter(ref => ref.id !== id));
  };

  const modifierReferent = (id: string, champ: string, valeur: any) => {
    setReferents(prev => prev.map(ref => 
      ref.id === id ? { ...ref, [champ]: valeur } : ref
    ));
  };

  const toggleTypeReferent = (refId: string, type: string) => {
    setReferents(prev => prev.map(ref => {
      if (ref.id === refId) {
        const types = ref.types.includes(type)
          ? ref.types.filter(t => t !== type)
          : [...ref.types, type];
        return { ...ref, types };
      }
      return ref;
    }));
  };

  // Gestion de la tarification
  const modifierTarification = (categorieId: string, prixNegocie: number) => {
    setTarification(prev => prev.map(tarif => {
      if (tarif.categorieId === categorieId) {
        const categorie = CATEGORIES_CHAMBRES.find(c => c.id === categorieId);
        const reduction = categorie ? Math.round(((categorie.prixBase - prixNegocie) / categorie.prixBase) * 100) : 0;
        return { ...tarif, prixNegocie, reduction };
      }
      return tarif;
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation basique
      if (!formData.nom.trim()) {
        throw new Error('Le nom est obligatoire');
      }

      if (formData.type !== 'Particulier' && !formData.siret && !formData.rna) {
        throw new Error('Le SIRET ou RNA est obligatoire pour les entreprises et associations');
      }

      // Simulation d'ajout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Client "${formData.nom}" ajouté avec succès avec ${referents.length} référent(s) !`);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
      
      // Reset du formulaire
      setFormData({
        type: 'Particulier' as ClientCategory,
        nom: '',
        siret: '',
        rna: '',
        statutJuridique: '',
        adresse: '',
        ville: '',
        codePostal: '',
        secteurActivite: '',
        entiteFacturee: '',
        iban: '',
        delaiPaiement: 30,
        contactFacturation: '',
        notes: ''
      });
      setReferents([]);
      setTarification(CATEGORIES_CHAMBRES.map(cat => ({
        categorieId: cat.id,
        prixNegocie: cat.prixBase,
        reduction: 0
      })));
      setActiveTab('general');

    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du client');
    } finally {
      setLoading(false);
    }
  };

  const economieAnnuelle = tarification.reduce((total, tarif) => {
    const categorie = CATEGORIES_CHAMBRES.find(c => c.id === tarif.categorieId);
    if (categorie) {
      return total + (categorie.prixBase - tarif.prixNegocie) * 50; // Estimation 50 nuits/an
    }
    return total;
  }, 0);

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
          <CardTitle className="text-2xl flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Ajouter un nouveau client prescripteur</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Informations générales</TabsTrigger>
                <TabsTrigger value="facturation">Facturation</TabsTrigger>
                <TabsTrigger value="referents">Référents ({referents.length})</TabsTrigger>
                <TabsTrigger value="tarification">Conventions tarifaires</TabsTrigger>
              </TabsList>

              {/* Onglet Informations générales */}
              <TabsContent value="general" className="space-y-6">
                {/* Sélection du type */}
                <div>
                  <Label className="text-base font-medium">Type de structure *</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {CLIENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.type === type.id;
                      
                      return (
                        <Card 
                          key={type.id}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        >
                          <CardContent className="p-4 text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <div className="font-medium">{type.label}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom / Raison sociale *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>

                  {formData.type === 'Entreprise' && (
                    <div>
                      <Label htmlFor="siret">SIRET *</Label>
                      <Input
                        id="siret"
                        value={formData.siret}
                        onChange={(e) => setFormData(prev => ({ ...prev, siret: e.target.value }))}
                        placeholder="14 chiffres"
                      />
                    </div>
                  )}

                  {formData.type === 'Association' && (
                    <div>
                      <Label htmlFor="rna">Numéro RNA/SIREN *</Label>
                      <Input
                        id="rna"
                        value={formData.rna}
                        onChange={(e) => setFormData(prev => ({ ...prev, rna: e.target.value }))}
                        placeholder="W + 9 chiffres ou SIREN"
                      />
                    </div>
                  )}

                  {formData.type !== 'Particulier' && (
                    <div>
                      <Label htmlFor="statutJuridique">Statut juridique</Label>
                      <select
                        id="statutJuridique"
                        value={formData.statutJuridique}
                        onChange={(e) => setFormData(prev => ({ ...prev, statutJuridique: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Sélectionner un statut</option>
                        {STATUTS_JURIDIQUES.map(statut => (
                          <option key={statut} value={statut}>{statut}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="secteurActivite">Secteur d'activité</Label>
                    <select
                      id="secteurActivite"
                      value={formData.secteurActivite}
                      onChange={(e) => setFormData(prev => ({ ...prev, secteurActivite: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Sélectionner un secteur</option>
                      {SECTEURS_ACTIVITE.map(secteur => (
                        <option key={secteur} value={secteur}>{secteur}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse complète</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="codePostal">Code postal</Label>
                    <Input
                      id="codePostal"
                      value={formData.codePostal}
                      onChange={(e) => setFormData(prev => ({ ...prev, codePostal: e.target.value }))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Facturation */}
              <TabsContent value="facturation" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entiteFacturee">Entité à facturer</Label>
                    <Input
                      id="entiteFacturee"
                      value={formData.entiteFacturee}
                      onChange={(e) => setFormData(prev => ({ ...prev, entiteFacturee: e.target.value }))}
                      placeholder="Si différente de la structure"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delaiPaiement">Délai de paiement (jours)</Label>
                    <Input
                      id="delaiPaiement"
                      type="number"
                      value={formData.delaiPaiement}
                      onChange={(e) => setFormData(prev => ({ ...prev, delaiPaiement: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  />
                </div>

                <div>
                  <Label htmlFor="contactFacturation">Contact facturation</Label>
                  <Input
                    id="contactFacturation"
                    value={formData.contactFacturation}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactFacturation: e.target.value }))}
                    placeholder="Nom du service comptabilité"
                  />
                </div>
              </TabsContent>

              {/* Onglet Référents */}
              <TabsContent value="referents" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Référents</h3>
                    <p className="text-sm text-gray-600">Gérez les contacts de cette structure</p>
                  </div>
                  <Button type="button" onClick={ajouterReferent} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un référent</span>
                  </Button>
                </div>

                {referents.length === 0 && (
                  <Card className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun référent</h3>
                    <p className="text-gray-600">Ajoutez des référents pour faciliter la communication</p>
                  </Card>
                )}

                {referents.map((referent, index) => (
                  <Card key={referent.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Référent #{index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => supprimerReferent(referent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nom *</Label>
                          <Input
                            value={referent.nom}
                            onChange={(e) => modifierReferent(referent.id, 'nom', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Prénom *</Label>
                          <Input
                            value={referent.prenom}
                            onChange={(e) => modifierReferent(referent.id, 'prenom', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={referent.email}
                            onChange={(e) => modifierReferent(referent.id, 'email', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={referent.telephone}
                            onChange={(e) => modifierReferent(referent.id, 'telephone', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Fonction</Label>
                        <Input
                          value={referent.fonction}
                          onChange={(e) => modifierReferent(referent.id, 'fonction', e.target.value)}
                          placeholder="Ex: Directeur, Responsable social..."
                        />
                      </div>

                      <div>
                        <Label>Rôles</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {TYPES_REFERENT.map(type => (
                            <Button
                              key={type}
                              type="button"
                              variant={referent.types.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleTypeReferent(referent.id, type)}
                            >
                              {type === 'contact_principal' && 'Contact principal'}
                              {type === 'facturation' && 'Facturation'}
                              {type === 'juridique' && 'Juridique'}
                              {type === 'technique' && 'Technique'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

                             {/* Onglet Tarification */}
               <TabsContent value="tarification" className="space-y-6">
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

                     {/* Interface de filtrage */}
                     {conventionsPrix.length > 0 && (
                       <Card className="p-4 bg-gray-50">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-2">
                               <Building className="h-4 w-4 text-blue-600" />
                               <Label className="text-sm font-medium text-gray-700">Filtrer par type de chambre :</Label>
                             </div>
                             <select
                               value={filtreTypeChambre}
                               onChange={(e) => setFiltreTypeChambre(e.target.value)}
                               className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                             >
                               <option value="tous">🏨 Tous les types</option>
                               {typesChambresUniques.map(type => (
                                 <option key={type} value={type}>
                                   {type === 'standard' && '🏠 Standard'}
                                   {type === 'confort' && '🛏️ Confort'}
                                   {type === 'superieure' && '⭐ Supérieure'}
                                   {type === 'suite' && '👑 Suite'}
                                   {type === 'adaptee' && '♿ Adaptée PMR'}
                                   {!['standard', 'confort', 'superieure', 'suite', 'adaptee'].includes(type) && `🏢 ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                                 </option>
                               ))}
                             </select>
                           </div>
                           <div className="flex items-center space-x-2 text-sm text-gray-600">
                             <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                               {conventionsFiltrees.length} convention{conventionsFiltrees.length > 1 ? 's' : ''}
                             </span>
                             {filtreTypeChambre !== 'tous' && (
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setFiltreTypeChambre('tous')}
                                 className="text-xs"
                               >
                                 Effacer le filtre
                               </Button>
                             )}
                           </div>
                         </div>
                       </Card>
                     )}

                     {conventionsFiltrees.length === 0 && (
                       <Card className="p-8 text-center">
                         <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                         <h3 className="text-lg font-medium text-gray-900 mb-2">
                           {conventionsPrix.length === 0 ? 'Aucun tarif chambre' : 'Aucun tarif pour ce type de chambre'}
                         </h3>
                         <p className="text-gray-600">
                           {conventionsPrix.length === 0 
                             ? 'Ajoutez des tarifs par type de chambre pour personnaliser les prix'
                             : 'Aucune convention ne correspond au filtre sélectionné'
                           }
                         </p>
                       </Card>
                     )}

                     {conventionsFiltrees.map((convention, index) => (
                       <Card key={index}>
                         <CardHeader className="flex flex-row items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <CardTitle className="text-base">Tarif chambre par jour pour le mois sélectionné #{index + 1}</CardTitle>
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               convention.typeChambre === 'standard' ? 'bg-blue-100 text-blue-800' :
                               convention.typeChambre === 'confort' ? 'bg-green-100 text-green-800' :
                               convention.typeChambre === 'superieure' ? 'bg-yellow-100 text-yellow-800' :
                               convention.typeChambre === 'suite' ? 'bg-purple-100 text-purple-800' :
                               convention.typeChambre === 'adaptee' ? 'bg-orange-100 text-orange-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {convention.typeChambre.charAt(0).toUpperCase() + convention.typeChambre.slice(1)}
                             </span>
                           </div>
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

            {/* Notes générales */}
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="notes">Notes et observations</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button type="button" variant="outline" disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? 'Création en cours...' : 'Créer le client prescripteur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClientPage; 
