"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Calendar, 
  User, 
  Building2, 
  Bed, 
  Users, 
  Euro,
  Clock,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../hooks/useNotifications';

interface QuickReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomData: {
    hotel: string;
    hotelAddress: string;
    hotelVille: string;
    roomNumber: string;
    roomType: string;
    pricePerNight: number;
    totalPrice: number;
    characteristics: string[];
    capacity: number;
    roomId?: number;
    hotelId?: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  hotels: any[];
  operateurs: any[];
}

interface Usager {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  date_naissance?: string;
  age?: number;
  sexe?: 'M' | 'F';
  isChefFamille: boolean;
}

interface FormData {
  usagers: Usager[];
  operateur_id: number | null;
  prescripteur_id: number | null; // ID du prescripteur qui paie
  nombre_personnes: number;
  notes: string;
  rentalMode: 'pax' | 'room'; // Mode de location pour cette réservation
}

export default function QuickReservationModal({
  isOpen,
  onClose,
  onSuccess,
  roomData,
  dateRange,
  hotels,
  operateurs
}: QuickReservationModalProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState<FormData>({
    usagers: [{
      id: '1',
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      age: undefined,
      sexe: undefined,
      isChefFamille: true
    }],
    operateur_id: operateurs.length > 0 ? operateurs[0].id : null,
    prescripteur_id: operateurs.length > 0 ? operateurs[0].id : null,
    nombre_personnes: 1,
    notes: '',
    rentalMode: 'room' // Mode par défaut
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hotelId, setHotelId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);

  // Calculer la durée du séjour
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);
  const duree = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculer le prix selon le mode de location
  const calculatePrice = () => {
    const basePrice = roomData.pricePerNight;
    if (formData.rentalMode === 'pax') {
      // Mode PAX : prix par personne
      return basePrice * formData.usagers.length * duree;
    } else {
      // Mode chambre complète : prix fixe
      return basePrice * duree;
    }
  };
  
  const prixTotal = calculatePrice();

  // Trouver l'ID de l'hôtel et de la chambre
  useEffect(() => {
    const hotel = hotels.find(h => h.nom === roomData.hotel);
    if (hotel) {
      setHotelId(hotel.id);
      // Simuler la recherche de l'ID de la chambre
      // En réalité, il faudrait récupérer l'ID depuis la base de données
      setRoomId(parseInt(roomData.roomNumber));
    }
  }, [roomData.hotel, hotels]);

  // Mettre à jour le nombre de personnes quand les usagers changent
  useEffect(() => {
    setFormData(prev => ({ ...prev, nombre_personnes: prev.usagers.length }));
  }, [formData.usagers.length]);

  // Recalculer le prix quand le mode de location ou le nombre d'usagers change
  useEffect(() => {
    // Le prix sera recalculé automatiquement grâce à la fonction calculatePrice()
  }, [formData.rentalMode, formData.usagers.length]);

  // Fonctions pour gérer les usagers
  const addUsager = () => {
    if (formData.usagers.length < roomData.capacity) {
      const newUsager: Usager = {
        id: Date.now().toString(),
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        age: undefined,
        sexe: undefined,
        isChefFamille: false
      };
      setFormData(prev => ({
        ...prev,
        usagers: [...prev.usagers, newUsager]
      }));
    }
  };

  const removeUsager = (id: string) => {
    if (formData.usagers.length > 1) {
      setFormData(prev => ({
        ...prev,
        usagers: prev.usagers.filter(u => u.id !== id)
      }));
    }
  };

  const updateUsager = (id: string, field: keyof Usager, value: any) => {
    setFormData(prev => ({
      ...prev,
      usagers: prev.usagers.map(u => 
        u.id === id ? { ...u, [field]: value } : u
      )
    }));
  };

  const setChefFamille = (id: string) => {
    setFormData(prev => ({
      ...prev,
      usagers: prev.usagers.map(u => ({
        ...u,
        isChefFamille: u.id === id
      }))
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Valider les usagers
    formData.usagers.forEach((usager, index) => {
      if (!usager.nom.trim()) {
        newErrors[`usager_${index}_nom`] = 'Le nom est obligatoire';
      }
      if (!usager.prenom.trim()) {
        newErrors[`usager_${index}_prenom`] = 'Le prénom est obligatoire';
      }
    });

    // Vérifier qu'il y a un chef de famille
    const hasChefFamille = formData.usagers.some(u => u.isChefFamille);
    if (!hasChefFamille) {
      newErrors.chef_famille = 'Un chef de famille doit être désigné';
    }

         if (!formData.operateur_id) {
       newErrors.operateur_id = 'Veuillez sélectionner un référent';
     }

    if (!formData.prescripteur_id) {
      newErrors.prescripteur_id = 'Veuillez sélectionner un prescripteur payeur';
    }

    if (formData.usagers.length < 1) {
      newErrors.usagers = 'Au moins un usager doit être renseigné';
    }

    if (formData.usagers.length > roomData.capacity) {
      newErrors.usagers = `Cette chambre ne peut accueillir que ${roomData.capacity} personne(s) maximum`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    if (!roomData.roomId) {
      setErrors({ submit: 'Impossible de récupérer les informations de la chambre' });
      return;
    }

    setIsSubmitting(true);
    
    try {
             // Utiliser la fonction de base de données pour créer la réservation
       const { data: reservationId, error } = await supabase
         .rpc('create_quick_reservation', {
           p_usagers: formData.usagers,
           p_room_id: roomData.roomId,
           p_operateur_id: formData.operateur_id,
           p_prescripteur_id: formData.prescripteur_id,
           p_date_arrivee: dateRange.startDate,
           p_date_depart: dateRange.endDate,
           p_nombre_personnes: formData.usagers.length,
           p_notes: formData.notes,
           p_rental_mode: formData.rentalMode,
           p_prix_total: prixTotal
         });

      if (error) {
        throw new Error(`Erreur lors de la création de la réservation: ${error.message}`);
      }

      // Notification de succès
      addNotification('success', 'Réservation créée - La réservation a été enregistrée avec succès.');
      
      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess();
      }
      
      // Fermer le modal
      onClose();
      
      // Réinitialiser le formulaire
      resetForm();
      
      // Rediriger vers la liste des réservations
      setTimeout(() => {
        window.location.href = '/?tab=reservations';
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      // Notification d'erreur
      addNotification('error', 'Échec de la création - Impossible d\'enregistrer la réservation. Réessayez.');
      setErrors({ submit: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      usagers: [{
        id: '1',
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        age: undefined,
        sexe: undefined,
        isChefFamille: true
      }],
      operateur_id: operateurs.length > 0 ? operateurs[0].id : null,
      prescripteur_id: operateurs.length > 0 ? operateurs[0].id : null,
      nombre_personnes: 1,
      notes: '',
      rentalMode: 'room'
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Réservation rapide</h2>
              <p className="text-sm text-gray-500">Réserver la chambre {roomData.roomNumber}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de la chambre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Détails de la chambre</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Hôtel</Label>
                  <p className="text-sm text-gray-900">{roomData.hotel}</p>
                  <p className="text-xs text-gray-500">{roomData.hotelAddress}, {roomData.hotelVille}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Chambre</Label>
                  <p className="text-sm text-gray-900">{roomData.roomNumber} - {roomData.roomType}</p>
                  <p className="text-xs text-gray-500">Capacité: {roomData.capacity} personne(s)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Période</Label>
                  <p className="text-sm text-gray-900">
                    {new Date(dateRange.startDate).toLocaleDateString('fr-FR')} - {new Date(dateRange.endDate).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-500">{duree} nuit(s)</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Prix</Label>
                  <p className="text-lg font-bold text-blue-600">{prixTotal}€</p>
                  <p className="text-xs text-gray-500">
                    {formData.rentalMode === 'pax' 
                      ? `${roomData.pricePerNight}€/personne/nuit` 
                      : `${roomData.pricePerNight}€/nuit`
                    }
                  </p>
                </div>
              </div>

              {/* Mode de location */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Mode de location</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rentalMode"
                      value="room"
                      checked={formData.rentalMode === 'room'}
                      onChange={(e) => handleInputChange('rentalMode', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Chambre complète</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rentalMode"
                      value="pax"
                      checked={formData.rentalMode === 'pax'}
                      onChange={(e) => handleInputChange('rentalMode', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Par personne (PAX)</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.rentalMode === 'pax' 
                    ? `Prix calculé pour ${formData.usagers.length} personne(s)`
                    : 'Prix fixe pour la chambre entière'
                  }
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Équipements</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(roomData.characteristics) 
                    ? roomData.characteristics.map((char, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {char}
                        </Badge>
                      ))
                    : roomData.characteristics && typeof roomData.characteristics === 'string' 
                      ? (roomData.characteristics as string).split(',').map((char, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {char.trim()}
                          </Badge>
                        ))
                      : null
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations des usagers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Informations des usagers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formData.usagers.length}/{roomData.capacity} personne(s)
                  </Badge>
                  {formData.usagers.length < roomData.capacity && (
                    <Button
                      type="button"
                      onClick={addUsager}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <User className="h-4 w-4" />
                      Ajouter
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.usagers.map((usager, index) => (
                <div key={usager.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={usager.isChefFamille ? "default" : "secondary"}>
                        {usager.isChefFamille ? "Chef de famille" : `Usager ${index + 1}`}
                      </Badge>
                      {!usager.isChefFamille && (
                        <Button
                          type="button"
                          onClick={() => setChefFamille(usager.id)}
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                        >
                          Définir chef
                        </Button>
                      )}
                    </div>
                    {formData.usagers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeUsager(usager.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`usager_${index}_nom`}>Nom *</Label>
                      <Input
                        id={`usager_${index}_nom`}
                        value={usager.nom}
                        onChange={(e) => updateUsager(usager.id, 'nom', e.target.value)}
                        required
                      />
                      {errors[`usager_${index}_nom`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`usager_${index}_nom`]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`usager_${index}_prenom`}>Prénom *</Label>
                      <Input
                        id={`usager_${index}_prenom`}
                        value={usager.prenom}
                        onChange={(e) => updateUsager(usager.id, 'prenom', e.target.value)}
                        required
                      />
                      {errors[`usager_${index}_prenom`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`usager_${index}_prenom`]}</p>
                      )}
                    </div>
                  </div>

                                     <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <Label htmlFor={`usager_${index}_telephone`}>Téléphone</Label>
                       <Input
                         id={`usager_${index}_telephone`}
                         value={usager.telephone}
                         onChange={(e) => updateUsager(usager.id, 'telephone', e.target.value)}
                         type="tel"
                       />
                     </div>
                     <div>
                       <Label htmlFor={`usager_${index}_email`}>Email</Label>
                       <Input
                         id={`usager_${index}_email`}
                         value={usager.email}
                         onChange={(e) => updateUsager(usager.id, 'email', e.target.value)}
                         type="email"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <Label htmlFor={`usager_${index}_age`}>Âge</Label>
                       <Input
                         id={`usager_${index}_age`}
                         value={usager.age || ''}
                         onChange={(e) => updateUsager(usager.id, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                         type="number"
                         min="0"
                         max="120"
                         placeholder="Âge"
                       />
                     </div>
                     <div>
                       <Label htmlFor={`usager_${index}_sexe`}>Sexe</Label>
                       <select
                         id={`usager_${index}_sexe`}
                         value={usager.sexe || ''}
                         onChange={(e) => updateUsager(usager.id, 'sexe', e.target.value || undefined)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">Sélectionner</option>
                         <option value="M">Masculin</option>
                         <option value="F">Féminin</option>
                       </select>
                     </div>
                   </div>
                </div>
              ))}

              {errors.chef_famille && (
                <p className="text-red-500 text-sm">{errors.chef_famille}</p>
              )}
              {errors.usagers && (
                <p className="text-red-500 text-sm">{errors.usagers}</p>
              )}
            </CardContent>
          </Card>

                     {/* Informations du prescripteur et référent */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center space-x-2">
                 <Building2 className="h-5 w-5" />
                 <span>Prescripteur et référent</span>
               </CardTitle>
             </CardHeader>
            <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="prescripteur_id">Prescripteur payeur *</Label>
                   <select
                     id="prescripteur_id"
                     value={formData.prescripteur_id || ''}
                     onChange={(e) => handleInputChange('prescripteur_id', parseInt(e.target.value))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   >
                     <option value="">Sélectionner un prescripteur</option>
                     {operateurs.map((operateur) => (
                       <option key={operateur.id} value={operateur.id}>
                         {operateur.organisation}
                       </option>
                     ))}
                   </select>
                   {errors.prescripteur_id && <p className="text-red-500 text-sm mt-1">{errors.prescripteur_id}</p>}
                 </div>
                 <div>
                   <Label htmlFor="operateur_id">Référent *</Label>
                   <select
                     id="operateur_id"
                     value={formData.operateur_id || ''}
                     onChange={(e) => handleInputChange('operateur_id', parseInt(e.target.value))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   >
                     <option value="">Sélectionner un référent</option>
                     {operateurs.map((operateur) => (
                       <option key={operateur.id} value={operateur.id}>
                         {operateur.organisation}
                       </option>
                     ))}
                   </select>
                   {errors.operateur_id && <p className="text-red-500 text-sm mt-1">{errors.operateur_id}</p>}
                 </div>
               </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Résumé et validation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Résumé de la réservation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chambre:</span>
                  <span className="text-sm font-medium">{roomData.roomNumber} - {roomData.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Période:</span>
                  <span className="text-sm font-medium">{duree} nuit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mode de location:</span>
                  <span className="text-sm font-medium">
                    {formData.rentalMode === 'pax' ? 'Par personne (PAX)' : 'Chambre complète'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nombre de personnes:</span>
                  <span className="text-sm font-medium">{formData.usagers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prix total:</span>
                  <span className="text-lg font-bold text-blue-600">{prixTotal}€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages d'erreur */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
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
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer la réservation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
