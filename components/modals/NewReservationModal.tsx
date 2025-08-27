'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Building2, Euro, Clock, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Hotel, OperateurSocial, Reservation } from '../../types';
import { supabase } from '../../lib/supabase';
import { useRoomCategories } from '@/hooks/useSupabase';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: Partial<Reservation>) => void;
  onSuccess?: () => void;
  isLoading?: boolean;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
}

interface FormData {
  usager_nom: string;
  usager_prenom: string;
  usager_telephone?: string;
  usager_email?: string;
  hotel_id: number | null;
  chambre_id: number | null;
  operateur_id: number | null;
  date_arrivee: string;
  date_depart: string;
  nombre_personnes: number;
  statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  prescripteur: string;
  prix: number;
  notes?: string;
}

export default function NewReservationModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  isLoading = false,
  hotels,
  operateurs
}: NewReservationModalProps) {
  const { categories: roomCategories } = useRoomCategories();
  
  // Helper to get category name from category_id
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !roomCategories) return 'Non défini';
    const category = roomCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Non défini';
  };
  const [formData, setFormData] = useState<FormData>({
    usager_nom: '',
    usager_prenom: '',
    usager_telephone: '',
    usager_email: '',
    hotel_id: hotels.length > 0 ? hotels[0].id : null,
    chambre_id: null,
    operateur_id: operateurs.length > 0 ? operateurs[0].id : null,
    date_arrivee: '',
    date_depart: '',
    nombre_personnes: 1,
    statut: 'EN_COURS',
    prescripteur: operateurs.length > 0 ? operateurs[0].organisation : '',
    prix: 0,
    notes: ''
  });

  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Charger les chambres disponibles quand l'hôtel ou les dates changent
  useEffect(() => {
    if (formData.hotel_id && formData.date_arrivee && formData.date_depart) {
      loadAvailableRooms();
    }
  }, [formData.hotel_id, formData.date_arrivee, formData.date_depart]);

  // Mettre à jour le prescripteur quand l'opérateur change
  useEffect(() => {
    if (formData.operateur_id) {
      const operateur = operateurs.find(op => op.id === formData.operateur_id);
      if (operateur) {
        setFormData(prev => ({ ...prev, prescripteur: operateur.organisation }));
      }
    }
  }, [formData.operateur_id, operateurs]);

  const loadAvailableRooms = async () => {
    if (!formData.hotel_id || !formData.date_arrivee || !formData.date_depart) return;

    setLoadingRooms(true);
    try {
      const { data, error } = await supabase
        .rpc('get_available_rooms', {
          p_hotel_id: formData.hotel_id,
          p_date_debut: formData.date_arrivee,
          p_date_fin: formData.date_depart
        });

      if (error) {
        console.error('Erreur lors du chargement des chambres:', error);
        // Fallback: charger toutes les chambres de l'hôtel
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', formData.hotel_id)
          .eq('statut', 'disponible');
        
        if (!roomsError) {
          setAvailableRooms(rooms || []);
        }
      } else {
        setAvailableRooms(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chambres:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.usager_nom.trim()) {
      newErrors.usager_nom = 'Le nom de l\'usager est obligatoire';
    }

    if (!formData.usager_prenom.trim()) {
      newErrors.usager_prenom = 'Le prénom de l\'usager est obligatoire';
    }

    if (!formData.hotel_id) {
      newErrors.hotel_id = 'Veuillez sélectionner un hôtel';
    }

    if (!formData.chambre_id) {
      newErrors.chambre_id = 'Veuillez sélectionner une chambre';
    }

    if (!formData.operateur_id) {
      newErrors.operateur_id = 'Veuillez sélectionner un opérateur';
    }

    if (!formData.date_arrivee) {
      newErrors.date_arrivee = 'La date d\'arrivée est obligatoire';
    }

    if (!formData.date_depart) {
      newErrors.date_depart = 'La date de départ est obligatoire';
    }

    if (formData.date_arrivee && formData.date_depart) {
      const arrivee = new Date(formData.date_arrivee);
      const depart = new Date(formData.date_depart);
      
      if (arrivee >= depart) {
        newErrors.date_depart = 'La date de départ doit être après la date d\'arrivée';
      }

      if (arrivee < new Date(new Date().toISOString().split('T')[0])) {
        newErrors.date_arrivee = 'La date d\'arrivée ne peut pas être dans le passé';
      }
    }

    if (formData.nombre_personnes < 1) {
      newErrors.nombre_personnes = 'Le nombre de personnes doit être au moins 1';
    }

    if (formData.prix < 0) {
      newErrors.prix = 'Le prix ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePrice = () => {
    if (!formData.chambre_id || !formData.date_arrivee || !formData.date_depart) return;

    const selectedRoom = availableRooms.find(room => room.room_id === formData.chambre_id);
    if (selectedRoom) {
      const arrivee = new Date(formData.date_arrivee);
      const depart = new Date(formData.date_depart);
      const nombreNuits = Math.ceil((depart.getTime() - arrivee.getTime()) / (1000 * 60 * 60 * 24));
      const prixTotal = selectedRoom.prix * nombreNuits * formData.nombre_personnes;
      
      setFormData(prev => ({ ...prev, prix: prixTotal }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur pour ce champ
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

    setIsSubmitting(true);
    
    try {
      // Créer d'abord l'usager
      const { data: usagerData, error: usagerError } = await supabase
        .from('usagers')
        .insert({
          nom: formData.usager_nom,
          prenom: formData.usager_prenom,
          telephone: formData.usager_telephone,
          email: formData.usager_email,
          statut: 'heberge'
        })
        .select()
        .single();

      if (usagerError) {
        throw new Error(`Erreur lors de la création de l'usager: ${usagerError.message}`);
      }

      // Calculer la durée
      const arrivee = new Date(formData.date_arrivee);
      const depart = new Date(formData.date_depart);
      const duree = Math.ceil((depart.getTime() - arrivee.getTime()) / (1000 * 60 * 60 * 24));

      // Créer la réservation
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          usager_id: usagerData.id,
          chambre_id: formData.chambre_id,
          hotel_id: formData.hotel_id,
          date_arrivee: formData.date_arrivee,
          date_depart: formData.date_depart,
          statut: formData.statut,
          prescripteur: formData.prescripteur,
          prix: formData.prix,
          duree: duree,
          operateur_id: formData.operateur_id,
          notes: formData.notes
        })
        .select(`
          *,
          usagers (nom, prenom, telephone, email),
          hotels (nom, adresse, ville),
          rooms (numero, category_id),
          operateurs_sociaux (nom, prenom, organisation)
        `)
        .single();

      if (reservationError) {
        throw new Error(`Erreur lors de la création de la réservation: ${reservationError.message}`);
      }

      console.log('Réservation créée avec succès:', reservationData);
      
      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess();
      }
      
      // Fermer le modal
      onClose();
      
      // Réinitialiser le formulaire
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      usager_nom: '',
      usager_prenom: '',
      usager_telephone: '',
      usager_email: '',
      hotel_id: hotels.length > 0 ? hotels[0].id : null,
      chambre_id: null,
      operateur_id: operateurs.length > 0 ? operateurs[0].id : null,
      date_arrivee: '',
      date_depart: '',
      nombre_personnes: 1,
      statut: 'EN_COURS',
      prescripteur: operateurs.length > 0 ? operateurs[0].organisation : '',
      prix: 0,
      notes: ''
    });
    setErrors({});
    setStep(1);
    setAvailableRooms([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculer le prix automatiquement quand les données changent
  useEffect(() => {
    calculatePrice();
  }, [formData.chambre_id, formData.date_arrivee, formData.date_depart, formData.nombre_personnes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle réservation</h2>
              <p className="text-sm text-gray-500">Créer une nouvelle réservation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Informations de base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                                      <Label htmlFor="usager_nom">Nom de l'usager *</Label>
                    <Input
                      id="usager_nom"
                      value={formData.usager_nom}
                      onChange={(e) => handleInputChange('usager_nom', e.target.value)}
                      placeholder="Nom"
                      required
                    />
                    {errors.usager_nom && <p className="text-red-500 text-sm mt-1">{errors.usager_nom}</p>}
                  </div>

                  <div>
                    <Label htmlFor="usager_prenom">Prénom de l'usager *</Label>
                    <Input
                      id="usager_prenom"
                      value={formData.usager_prenom}
                      onChange={(e) => handleInputChange('usager_prenom', e.target.value)}
                      placeholder="Prénom"
                      required
                    />
                    {errors.usager_prenom && <p className="text-red-500 text-sm mt-1">{errors.usager_prenom}</p>}
                  </div>

                <div>
                  <Label htmlFor="usager_telephone">Téléphone</Label>
                  <Input
                    id="usager_telephone"
                    value={formData.usager_telephone}
                    onChange={(e) => handleInputChange('usager_telephone', e.target.value)}
                    placeholder="Téléphone"
                  />
                </div>

                <div>
                  <Label htmlFor="usager_email">Email</Label>
                  <Input
                    id="usager_email"
                    type="email"
                    value={formData.usager_email}
                    onChange={(e) => handleInputChange('usager_email', e.target.value)}
                    placeholder="Email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hébergement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2" />
                  Hébergement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                  <div>
                    <Label htmlFor="hotel_id">Hôtel *</Label>
                    <select
                      id="hotel_id"
                      value={formData.hotel_id || ''}
                      onChange={(e) => handleInputChange('hotel_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Sélectionner un hôtel</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.nom} - {hotel.ville}
                        </option>
                      ))}
                    </select>
                    {errors.hotel_id && <p className="text-red-500 text-sm mt-1">{errors.hotel_id}</p>}
                  </div>

                  <div>
                    <Label htmlFor="chambre_id">Chambre *</Label>
                    <select
                      id="chambre_id"
                      value={formData.chambre_id || ''}
                      onChange={(e) => handleInputChange('chambre_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      disabled={loadingRooms || !formData.hotel_id}
                    >
                      <option value="">
                        {loadingRooms ? 'Chargement...' : 'Sélectionner une chambre'}
                      </option>
                      {availableRooms.map((room) => (
                        <option key={room.room_id || room.id} value={room.room_id || room.id}>
                          Chambre {room.numero} - {getCategoryName(room.category_id)} ({room.prix}€/nuit)
                        </option>
                      ))}
                    </select>
                    {errors.chambre_id && <p className="text-red-500 text-sm mt-1">{errors.chambre_id}</p>}
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_arrivee">Date d'arrivée *</Label>
                    <Input
                      id="date_arrivee"
                      type="date"
                      value={formData.date_arrivee}
                      onChange={(e) => {
                        handleInputChange('date_arrivee', e.target.value);
                      }}
                      required
                    />
                    {errors.date_arrivee && <p className="text-red-500 text-sm mt-1">{errors.date_arrivee}</p>}
                  </div>

                  <div>
                    <Label htmlFor="date_depart">Date de départ *</Label>
                    <Input
                      id="date_depart"
                      type="date"
                      value={formData.date_depart}
                      onChange={(e) => {
                        handleInputChange('date_depart', e.target.value);
                      }}
                      required
                    />
                    {errors.date_depart && <p className="text-red-500 text-sm mt-1">{errors.date_depart}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_personnes">Nombre de personnes</Label>
                    <Input
                      id="nombre_personnes"
                      type="number"
                      value={formData.nombre_personnes}
                      onChange={(e) => handleInputChange('nombre_personnes', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prescripteur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Prescripteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                  <div>
                    <Label htmlFor="operateur_id">Opérateur</Label>
                    <select
                      id="operateur_id"
                      value={formData.operateur_id || ''}
                      onChange={(e) => handleInputChange('operateur_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Sélectionner un opérateur</option>
                      {operateurs.map((operateur) => (
                        <option key={operateur.id} value={operateur.id}>
                          {operateur.organisation}
                        </option>
                      ))}
                    </select>
                    {errors.operateur_id && <p className="text-red-500 text-sm mt-1">{errors.operateur_id}</p>}
                  </div>
              </CardContent>
            </Card>

            {/* Tarification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Euro className="h-5 w-5 mr-2" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prix">Prix total (€)</Label>
                  <Input
                    id="prix"
                    type="number"
                    value={formData.prix}
                    onChange={(e) => handleInputChange('prix', parseFloat(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <select
                    id="statut"
                    value={formData.statut}
                    onChange={(e) => handleInputChange('statut', e.target.value as 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="EN_COURS">En cours</option>
                    <option value="CONFIRMEE">Confirmée</option>
                    <option value="TERMINEE">Terminée</option>
                    <option value="ANNULEE">Annulée</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations complémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2" />
                Informations complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affichage des erreurs globales */}
          {errors.submit && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingRooms}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Créer la réservation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
