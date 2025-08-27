'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Hotel, CreditCard, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useNotifications } from '@/hooks/useNotifications';
import { clientsApi } from '@/lib/api/clients';
import { reservationsApi, type SimpleReservationInsert } from '@/lib/api/reservations';
import type { Client } from '@/lib/supabase';
import type { AvailableRoom } from '../features/AvailabilityResults';
import type { AvailabilitySearchCriteria } from '../features/AvailabilitySearchForm';

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: AvailableRoom;
  searchCriteria: AvailabilitySearchCriteria;
  onSuccess?: () => void;
}

export default function CreateReservationModal({
  isOpen,
  onClose,
  roomData,
  searchCriteria,
  onSuccess
}: CreateReservationModalProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');

  // Calculate reservation details
  const checkInDate = new Date(searchCriteria.checkInDate);
  const checkOutDate = new Date(searchCriteria.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const roomRate = roomData.prix;
  const totalAmount = roomRate * nights;

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const response = await clientsApi.getClients();
      if (response.success && response.data) {
        // Filter active clients only
        const activeClients = response.data.filter(client => client.statut === 'actif');
        setClients(activeClients);
      } else {
        addNotification('error', 'Erreur lors du chargement des clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      addNotification('error', 'Erreur lors du chargement des clients');
    } finally {
      setClientsLoading(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedClientId) {
      addNotification('error', 'Veuillez sélectionner un client');
      return;
    }

    setLoading(true);
    try {
      const reservationData: SimpleReservationInsert = {
        hotel_id: roomData.hotel_id,
        chambre_id: roomData.id,
        usager_id: selectedClientId,
        date_arrivee: searchCriteria.checkInDate,
        date_depart: searchCriteria.checkOutDate,
        adults_count: searchCriteria.adults,
        children_count: searchCriteria.children,
        room_rate: roomRate,
        total_amount: totalAmount,
        special_requests: specialRequests.trim() || undefined,
        statut: 'confirmed' // Directly confirm the reservation
      };

      const response = await reservationsApi.createReservation(reservationData);

      if (response.success && response.data) {
        addNotification('success', `Réservation ${response.data.reservation_number} créée avec succès`);
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        addNotification('error', response.error || 'Erreur lors de la création de la réservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      addNotification('error', 'Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId(null);
    setSpecialRequests('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Créer une réservation</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Room Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hotel className="h-5 w-5 text-blue-600" />
                Détails de la chambre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Établissement</Label>
                  <p className="text-gray-900">{roomData.hotel?.nom}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Chambre</Label>
                  <p className="text-gray-900">N° {roomData.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Catégorie</Label>
                  <p className="text-gray-900">{roomData.category?.name || 'Non spécifiée'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prix par nuit</Label>
                  <p className="text-gray-900 font-semibold">{roomRate}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Détails de la réservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Arrivée</Label>
                  <p className="text-gray-900">
                    {checkInDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Départ</Label>
                  <p className="text-gray-900">
                    {checkOutDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Durée</Label>
                  <p className="text-gray-900">{nights} nuit{nights > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Voyageurs</Label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {searchCriteria.adults} adult{searchCriteria.adults > 1 ? 's' : ''}
                    {searchCriteria.children > 0 && `, ${searchCriteria.children} enfant${searchCriteria.children > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700">Prix total</p>
                    <p className="text-xs text-blue-600">{roomRate}€ × {nights} nuit{nights > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {totalAmount}€
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Sélection du client
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Chargement des clients...</p>
                </div>
              ) : clients.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun client actif trouvé. Veuillez d'abord créer un client.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="client-select">Client *</Label>
                  <select
                    id="client-select"
                    value={selectedClientId || ''}
                    onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionnez un client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nom} {client.prenom} {client.raison_sociale && `(${client.raison_sociale})`}
                      </option>
                    ))}
                  </select>

                  {/* Selected Client Info */}
                  {selectedClient && (
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <h4 className="font-medium text-gray-900 mb-2">Informations client</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Nom:</span>
                          <span className="ml-2 text-gray-900">{selectedClient.nom} {selectedClient.prenom}</span>
                        </div>
                        {selectedClient.email && (
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 text-gray-900">{selectedClient.email}</span>
                          </div>
                        )}
                        {selectedClient.telephone && (
                          <div>
                            <span className="text-gray-600">Téléphone:</span>
                            <span className="ml-2 text-gray-900">{selectedClient.telephone}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 text-gray-900">{selectedClient.client_type}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Requests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Demandes spéciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Demandes particulières du client (facultatif)..."
                rows={3}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateReservation}
            disabled={loading || !selectedClientId || clients.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmer la réservation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}