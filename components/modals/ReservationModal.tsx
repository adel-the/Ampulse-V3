"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  X, 
  Calendar, 
  Users, 
  Euro, 
  Bed, 
  Wifi, 
  Tv, 
  Coffee, 
  Car, 
  Accessibility, 
  Star,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock
} from 'lucide-react';

interface Room {
  id: number;
  numero: string;
  nom?: string;
  type: string;
  capacite: number;
  prix_base: number;
  equipements?: string[];
  statut: 'disponible' | 'occupee' | 'maintenance';
  hotel_id: number;
}

interface ReservationForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  nombre_personnes: number;
  date_arrivee: string;
  date_depart: string;
  notes: string;
  type_client: 'particulier' | 'entreprise' | 'association';
  statut_paiement: 'en_attente' | 'paye' | 'annule';
}

interface ReservationModalProps {
  room: Room;
  startDate: string;
  endDate: string;
  guests: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservationId: number) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  room,
  startDate,
  endDate,
  guests,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [form, setForm] = useState<ReservationForm>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: 'France',
    nombre_personnes: guests,
    date_arrivee: startDate,
    date_depart: endDate,
    notes: '',
    type_client: 'particulier',
    statut_paiement: 'en_attente'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculer le prix total
  const calculateTotalPrice = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return room.prix_base * Math.max(1, nights);
  };

  // Calculer le nombre de nuits
  const calculateNights = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!form.nom.trim()) return 'Le nom est obligatoire';
    if (!form.prenom.trim()) return 'Le prénom est obligatoire';
    if (!form.email.trim()) return 'L\'email est obligatoire';
    if (!form.telephone.trim()) return 'Le téléphone est obligatoire';
    if (!form.adresse.trim()) return 'L\'adresse est obligatoire';
    if (!form.ville.trim()) return 'La ville est obligatoire';
    if (!form.code_postal.trim()) return 'Le code postal est obligatoire';
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'L\'email n\'est pas valide';
    
    return null;
  };

  // Vérification de disponibilité corrigée
  const checkAvailability = async (roomId: number, startDate: string, endDate: string) => {
    try {
      // Méthode 1: Vérification simple (plus fiable)
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id, date_arrivee, date_depart')
        .eq('room_id', roomId)
        .eq('statut', 'confirmee')
        .gte('date_arrivee', startDate)
        .lte('date_depart', endDate);

      if (error) {
        throw new Error(`Erreur lors de la vérification: ${error.message}`);
      }

      // Si des réservations existent, il y a un conflit
      if (reservations && reservations.length > 0) {
        return {
          available: false,
          conflicts: reservations,
          message: `Cette chambre n'est plus disponible pour ces dates`
        };
      }

      // Méthode 2: Vérification des chevauchements
      const { data: overlapReservations, error: overlapError } = await supabase
        .from('reservations')
        .select('id, date_arrivee, date_depart')
        .eq('room_id', roomId)
        .eq('statut', 'confirmee');

      if (overlapError) {
        console.warn('Erreur lors de la vérification des chevauchements:', overlapError);
      } else {
        // Filtrer manuellement les chevauchements
        const overlapping = overlapReservations?.filter(res => {
          const resStart = new Date(res.date_arrivee);
          const resEnd = new Date(res.date_depart);
          const testStart = new Date(startDate);
          const testEnd = new Date(endDate);
          
          return resStart <= testEnd && resEnd >= testStart;
        }) || [];

        if (overlapping.length > 0) {
          return {
            available: false,
            conflicts: overlapping,
            message: `Cette chambre n'est plus disponible pour ces dates`
          };
        }
      }

      return {
        available: true,
        conflicts: [],
        message: 'Chambre disponible'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la vérification de disponibilité: ${errorMessage}`);
    }
  };

  // Soumettre la réservation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Vérifier la disponibilité de la chambre
      const availability = await checkAvailability(room.id, startDate, endDate);

      if (!availability.available) {
        throw new Error(availability.message);
      }

      // 2. Créer la réservation avec les colonnes existantes
      const reservationData = {
        room_id: room.id,
        hotel_id: room.hotel_id,
        nombre_personnes: form.nombre_personnes,
        date_arrivee: form.date_arrivee,
        date_depart: form.date_depart,
        prix_total: calculateTotalPrice(),
        nombre_nuits: calculateNights(),
        notes: form.notes,
        type_client: form.type_client,
        statut: 'confirmee',
        statut_paiement: form.statut_paiement
      };

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select('id')
        .single();

      if (reservationError) {
        throw new Error('Erreur lors de la création de la réservation');
      }

      // 3. Mettre à jour le statut de la chambre
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ statut: 'occupee' })
        .eq('id', room.id);

      if (roomError) {
        console.warn('Erreur lors de la mise à jour du statut de la chambre:', roomError);
      }

      // 4. Créer une notification
      const notificationData = {
        type: 'reservation',
        titre: 'Nouvelle réservation',
        message: `Réservation confirmée pour ${form.prenom} ${form.nom} - Chambre ${room.numero}`,
        statut: 'non_lu'
      };

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (notificationError) {
        console.warn('Erreur lors de la création de la notification:', notificationError);
      }

      setSuccess(true);
      
      // Appeler le callback de succès
      if (reservation && reservation.id) {
        onSuccess(reservation.id);
      }

      // Fermer le modal après 3 secondes
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // Équipements avec icônes
  const getEquipmentIcon = (equipment: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'WiFi': <Wifi className="h-4 w-4" />,
      'TV': <Tv className="h-4 w-4" />,
      'Climatisation': <Star className="h-4 w-4" />,
      'Mini-bar': <Coffee className="h-4 w-4" />,
      'Parking': <Car className="h-4 w-4" />,
      'Accès PMR': <Accessibility className="h-4 w-4" />,
      'Balcon': <MapPin className="h-4 w-4" />,
      'Salle de bain privée': <Star className="h-4 w-4" />
    };
    return icons[equipment] || <CheckCircle className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Réserver une chambre</h2>
            <p className="text-gray-600">Complétez vos informations pour confirmer la réservation</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire de réservation */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type de client */}
                <div>
                  <Label htmlFor="type_client">Type de client</Label>
                  <select
                    id="type_client"
                    value={form.type_client}
                    onChange={(e) => setForm(prev => ({ ...prev, type_client: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="particulier">Particulier</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="association">Association</option>
                  </select>
                </div>

                {/* Nom et prénom */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={form.prenom}
                      onChange={(e) => setForm(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Email et téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone *</Label>
                    <Input
                      id="telephone"
                      value={form.telephone}
                      onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <Label htmlFor="adresse">Adresse *</Label>
                  <Input
                    id="adresse"
                    value={form.adresse}
                    onChange={(e) => setForm(prev => ({ ...prev, adresse: e.target.value }))}
                    required
                  />
                </div>

                {/* Ville et code postal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ville">Ville *</Label>
                    <Input
                      id="ville"
                      value={form.ville}
                      onChange={(e) => setForm(prev => ({ ...prev, ville: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code_postal">Code postal *</Label>
                    <Input
                      id="code_postal"
                      value={form.code_postal}
                      onChange={(e) => setForm(prev => ({ ...prev, code_postal: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    value={form.pays}
                    onChange={(e) => setForm(prev => ({ ...prev, pays: e.target.value }))}
                  />
                </div>

                {/* Nombre de personnes */}
                <div>
                  <Label htmlFor="nombre_personnes">Nombre de personnes</Label>
                  <select
                    id="nombre_personnes"
                    value={form.nombre_personnes}
                    onChange={(e) => setForm(prev => ({ ...prev, nombre_personnes: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} personne{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes spéciales</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Demandes spéciales, allergies, préférences..."
                    rows={3}
                  />
                </div>

                {/* Messages d'erreur */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                {/* Message de succès */}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 text-sm">Réservation confirmée avec succès !</span>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Confirmation...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Confirmer la réservation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Résumé de la réservation */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Résumé de votre réservation</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bed className="h-5 w-5" />
                    <span>{room.nom || `Chambre ${room.numero}`}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Chambre {room.numero}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Dates de séjour</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Arrivée</span>
                        <span className="text-sm font-medium">{new Date(startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Départ</span>
                        <span className="text-sm font-medium">{new Date(endDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-sm text-gray-600">Nombre de nuits</span>
                        <span className="text-sm font-medium">{calculateNights()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacité */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Capacité :</span>
                    <Badge variant="secondary">{room.capacite} personne{room.capacite > 1 ? 's' : ''}</Badge>
                  </div>

                  {/* Équipements */}
                  {room.equipements && room.equipements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Équipements inclus</p>
                      <div className="flex flex-wrap gap-2">
                        {room.equipements.map((equipment, idx) => (
                          <div key={idx} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {getEquipmentIcon(equipment)}
                            <span>{equipment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prix */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prix par nuit</span>
                      <span className="text-sm font-medium">{room.prix_base}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Nombre de nuits</span>
                      <span className="text-sm font-medium">{calculateNights()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">{calculateTotalPrice()}€</span>
                    </div>
                  </div>

                  {/* Informations importantes */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Informations importantes</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Arrivée à partir de 14h00</li>
                      <li>• Départ avant 11h00</li>
                      <li>• Paiement à l'arrivée ou en ligne</li>
                      <li>• Annulation gratuite jusqu'à 24h avant</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal; 
