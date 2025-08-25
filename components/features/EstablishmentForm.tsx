'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Establishment, EstablishmentInsert, EstablishmentUpdate } from '@/lib/api/establishments';

interface EstablishmentFormProps {
  establishment?: Establishment;
  onSubmit: (data: EstablishmentInsert | EstablishmentUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone: string;
  email: string;
  gestionnaire: string;
  statut: 'ACTIF' | 'INACTIF';
  type_etablissement: 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre';
  chambres_total: number;
  chambres_occupees: number;
  siret?: string;
  tva_intracommunautaire?: string;
  directeur?: string;
  telephone_directeur?: string;
  email_directeur?: string;
  capacite?: number;
  classement_etoiles?: number;
  description?: string;
  site_web?: string;
  check_in_time?: string;
  check_out_time?: string;
  parking_places?: number;
  surface_totale?: number;
  nombre_etages?: number;
}

interface FormErrors {
  [key: string]: string;
}

const ESTABLISHMENT_TYPES = [
  { value: 'hotel', label: 'Hôtel' },
  { value: 'residence', label: 'Résidence' },
  { value: 'foyer', label: 'Foyer' },
  { value: 'chrs', label: 'CHRS' },
  { value: 'chr', label: 'CHR' },
  { value: 'autre', label: 'Autre' }
];

export default function EstablishmentForm({
  establishment,
  onSubmit,
  onCancel,
  isLoading = false
}: EstablishmentFormProps) {
  const isEditing = !!establishment;

  const [formData, setFormData] = useState<FormData>({
    nom: establishment?.nom || '',
    adresse: establishment?.adresse || '',
    ville: establishment?.ville || '',
    code_postal: establishment?.code_postal || '',
    telephone: establishment?.telephone || '',
    email: establishment?.email || '',
    gestionnaire: establishment?.gestionnaire || '',
    statut: establishment?.statut || 'ACTIF',
    type_etablissement: establishment?.type_etablissement || 'hotel',
    chambres_total: establishment?.chambres_total || 0,
    chambres_occupees: establishment?.chambres_occupees || 0,
    siret: establishment?.siret || '',
    tva_intracommunautaire: establishment?.tva_intracommunautaire || '',
    directeur: establishment?.directeur || '',
    telephone_directeur: establishment?.telephone_directeur || '',
    email_directeur: establishment?.email_directeur || '',
    capacite: establishment?.capacite || undefined,
    classement_etoiles: establishment?.classement_etoiles || undefined,
    description: establishment?.description || '',
    site_web: establishment?.site_web || '',
    check_in_time: establishment?.check_in_time || '',
    check_out_time: establishment?.check_out_time || '',
    parking_places: establishment?.parking_places || undefined,
    surface_totale: establishment?.surface_totale || undefined,
    nombre_etages: establishment?.nombre_etages || undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Calculer le taux d'occupation automatiquement
  useEffect(() => {
    const taux = formData.chambres_total > 0 
      ? Math.round((formData.chambres_occupees / formData.chambres_total) * 100)
      : 0;
    
    // On ne met pas à jour le formData directement pour éviter les boucles
    // Le taux sera calculé lors de la soumission
  }, [formData.chambres_total, formData.chambres_occupees]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Champs obligatoires
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est obligatoire';
    if (!formData.ville.trim()) newErrors.ville = 'La ville est obligatoire';
    if (!formData.code_postal.trim()) newErrors.code_postal = 'Le code postal est obligatoire';
    
    // Validation du code postal (format français)
    if (formData.code_postal && !/^\d{5}$/.test(formData.code_postal)) {
      newErrors.code_postal = 'Le code postal doit contenir 5 chiffres';
    }

    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.email_directeur && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_directeur)) {
      newErrors.email_directeur = 'Format d\'email invalide';
    }

    // Validation des chambres
    if (formData.chambres_occupees > formData.chambres_total) {
      newErrors.chambres_occupees = 'Ne peut pas dépasser le nombre total de chambres';
    }

    // Validation SIRET
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
    }

    // Validation classement étoiles
    if (formData.classement_etoiles && (formData.classement_etoiles < 1 || formData.classement_etoiles > 5)) {
      newErrors.classement_etoiles = 'Le classement doit être entre 1 et 5 étoiles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Calculer le taux d'occupation
      const taux_occupation = formData.chambres_total > 0 
        ? Math.round((formData.chambres_occupees / formData.chambres_total) * 100)
        : 0;

      const submitData = {
        ...formData,
        taux_occupation,
        is_active: formData.statut === 'ACTIF',
        // Convertir les chaînes vides en null pour les champs optionnels
        siret: formData.siret || null,
        tva_intracommunautaire: formData.tva_intracommunautaire || null,
        directeur: formData.directeur || null,
        telephone_directeur: formData.telephone_directeur || null,
        email_directeur: formData.email_directeur || null,
        description: formData.description || null,
        site_web: formData.site_web || null,
        check_in_time: formData.check_in_time || null,
        check_out_time: formData.check_out_time || null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const currentOccupancyRate = formData.chambres_total > 0 
    ? Math.round((formData.chambres_occupees / formData.chambres_total) * 100)
    : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-xl font-semibold">
          {isEditing ? 'Modifier l\'établissement' : 'Nouvel établissement'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom de l'établissement *
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className={errors.nom ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.nom && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nom}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_etablissement" className="text-sm font-medium">
                Type d'établissement
              </Label>
              <select
                id="type_etablissement"
                value={formData.type_etablissement}
                onChange={(e) => handleInputChange('type_etablissement', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                {ESTABLISHMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Adresse</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse" className="text-sm font-medium">
                  Adresse *
                </Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  className={errors.adresse ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.adresse && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.adresse}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code_postal" className="text-sm font-medium">
                    Code postal *
                  </Label>
                  <Input
                    id="code_postal"
                    value={formData.code_postal}
                    onChange={(e) => handleInputChange('code_postal', e.target.value)}
                    className={errors.code_postal ? 'border-red-500' : ''}
                    disabled={isLoading}
                    maxLength={5}
                  />
                  {errors.code_postal && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.code_postal}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="ville" className="text-sm font-medium">
                    Ville *
                  </Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => handleInputChange('ville', e.target.value)}
                    className={errors.ville ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.ville && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.ville}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-sm font-medium">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site_web" className="text-sm font-medium">
                Site web
              </Label>
              <Input
                id="site_web"
                type="url"
                value={formData.site_web}
                onChange={(e) => handleInputChange('site_web', e.target.value)}
                placeholder="https://exemple.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Gestionnaire */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Gestion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gestionnaire" className="text-sm font-medium">
                  Gestionnaire
                </Label>
                <Input
                  id="gestionnaire"
                  value={formData.gestionnaire}
                  onChange={(e) => handleInputChange('gestionnaire', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statut" className="text-sm font-medium">
                  Statut
                </Label>
                <select
                  id="statut"
                  value={formData.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chambres */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Chambres</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chambres_total" className="text-sm font-medium">
                  Chambres total
                </Label>
                <Input
                  id="chambres_total"
                  type="number"
                  min="0"
                  value={formData.chambres_total}
                  onChange={(e) => handleInputChange('chambres_total', parseInt(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chambres_occupees" className="text-sm font-medium">
                  Chambres occupées
                </Label>
                <Input
                  id="chambres_occupees"
                  type="number"
                  min="0"
                  max={formData.chambres_total}
                  value={formData.chambres_occupees}
                  onChange={(e) => handleInputChange('chambres_occupees', parseInt(e.target.value) || 0)}
                  className={errors.chambres_occupees ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.chambres_occupees && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.chambres_occupees}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Taux d'occupation
                </Label>
                <div className="flex items-center h-10 px-3 py-2 border border-input rounded-md bg-gray-50">
                  <Badge variant="outline" className="font-semibold">
                    {currentOccupancyRate}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations complémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siret" className="text-sm font-medium">
                  SIRET
                </Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleInputChange('siret', e.target.value)}
                  className={errors.siret ? 'border-red-500' : ''}
                  disabled={isLoading}
                  maxLength={17}
                  placeholder="12345678901234"
                />
                {errors.siret && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.siret}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classement_etoiles" className="text-sm font-medium">
                  Classement (étoiles)
                </Label>
                <Input
                  id="classement_etoiles"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.classement_etoiles || ''}
                  onChange={(e) => handleInputChange('classement_etoiles', parseInt(e.target.value) || 0)}
                  className={errors.classement_etoiles ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.classement_etoiles && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.classement_etoiles}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={3}
                placeholder="Description de l'établissement..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}