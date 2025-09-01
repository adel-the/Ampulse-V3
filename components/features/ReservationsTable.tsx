"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building2, 
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  Eye,
  FileDown,
  Plus,
  X
} from 'lucide-react';
import { Reservation, ProcessusReservation, Hotel, DocumentTemplate } from '../../types';

interface ReservationsTableProps {
  reservations: Reservation[];
  processus: ProcessusReservation[];
  hotels?: Hotel[];
  templates: DocumentTemplate[];
  onReservationSelect: (reservation: Reservation) => void;
  onProlongReservation?: (reservation: Reservation) => void;
  onEndCare?: (reservation: Reservation) => void;
  onUpdateReservation?: (reservation: Reservation) => void;
  onCancelReservation?: (reservation: Reservation) => void;
}

export default function ReservationsTable({ reservations, processus, hotels = [], templates, onReservationSelect, onProlongReservation, onEndCare, onUpdateReservation, onCancelReservation }: ReservationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProcessus, setSelectedProcessus] = useState<ProcessusReservation | null>(null);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'CONFIRMEE':
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'EN_COURS':
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'TERMINEE':
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'ANNULEE':
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessusStatusColor = (statut: string) => {
    switch (statut) {
      case 'termine': return 'bg-green-100 text-green-800';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessusStatusText = (statut: string) => {
    switch (statut) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'normale': return 'bg-blue-100 text-blue-800';
      case 'basse': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioriteText = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'Urgente';
      case 'haute': return 'Haute';
      case 'normale': return 'Normale';
      case 'basse': return 'Basse';
      default: return priorite;
    }
  };

  const filteredReservations = useMemo(() => {
    console.log(`🔍 [TABLE-DEBUG] useMemo recalculating filteredReservations - Total: ${reservations.length}`);
    
    return reservations.filter(reservation => {
      // DEBUG: Log all reservations and their status to track updates
      if (reservation.id <= 5) { // Only log first few to avoid spam
        console.log(`🔍 [TABLE-DEBUG] Reservation ${reservation.id} status:`, reservation.statut);
      }
      
      // Utiliser les données de détails si disponibles, sinon des valeurs par défaut
      const usagerName = reservation.usager || 'Usager non spécifié';
      const hotelName = reservation.hotel || 'Hôtel non spécifié';
      const prescripteur = reservation.prescripteur || 'Non spécifié';
      
      const matchesSearch = 
        usagerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescripteur.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || reservation.statut === statusFilter;
      
      // DEBUG: Log status filtering
      if (reservation.id <= 3 && reservation.statut === 'cancelled') {
        console.log(`🔍 [FILTER-DEBUG] Reservation ${reservation.id} - Status: ${reservation.statut}, Filter: ${statusFilter}, Matches: ${matchesStatus}`);
      }
      
      const matchesType = typeFilter === 'all' || (() => {
        const prescripteurLower = prescripteur.toLowerCase();
        if (typeFilter === 'entreprise') return prescripteurLower.includes('entreprise') || prescripteurLower.includes('sarl') || prescripteurLower.includes('sas');
        if (typeFilter === 'association') return prescripteurLower.includes('association') || prescripteurLower.includes('asso');
        if (typeFilter === 'institution') return prescripteurLower.includes('samusocial') || prescripteurLower.includes('social');
        if (typeFilter === 'particulier') return !prescripteurLower.includes('entreprise') && !prescripteurLower.includes('association') && !prescripteurLower.includes('samusocial');
        return true;
      })();
      
      const matchesHotel = hotelFilter === 'all' || hotelName === hotelFilter;
      
      const matchesDate = dateFilter === 'all' || (() => {
        const today = typeof window === 'undefined' 
          ? new Date('2024-01-01T00:00:00.000Z') 
          : new Date();
        const arrivalDate = new Date(reservation.dateArrivee);
        const departureDate = new Date(reservation.dateDepart);
        
        if (dateFilter === 'today') return arrivalDate.toDateString() === today.toDateString();
        if (dateFilter === 'week') {
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return arrivalDate >= today && arrivalDate <= weekFromNow;
        }
        if (dateFilter === 'month') {
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          return arrivalDate >= today && arrivalDate <= monthFromNow;
        }
        if (dateFilter === 'past') return departureDate < today;
        if (dateFilter === 'current') return arrivalDate <= today && departureDate >= today;
        return true;
      })();
      
      return matchesSearch && matchesStatus && matchesType && matchesHotel && matchesDate;
    });
  }, [reservations, searchTerm, statusFilter, typeFilter, hotelFilter, dateFilter]);

  // DEBUG: Log filtered results
  console.log(`🔍 [TABLE-DEBUG] Filtered: ${filteredReservations.length}`);
  console.log(`🔍 [TABLE-DEBUG] Filter states - Status: ${statusFilter}, Type: ${typeFilter}, Hotel: ${hotelFilter}, Date: ${dateFilter}`);

  const getProcessusForReservation = (reservationId: number) => {
    return processus.find(p => p.reservationId === reservationId);
  };

  const handleViewProcessus = (processus: ProcessusReservation) => {
    setSelectedProcessus(processus);
  };

  const handleCloseProcessus = () => {
    setSelectedProcessus(null);
  };

  // Fonctions de gestion des réservations
  const handleConfirmReservation = async (reservation: Reservation) => {
    try {
      // Trouver le template de confirmation
      const confirmationTemplate = templates.find(t => t.type === 'bon_reservation');
      if (!confirmationTemplate) {
        alert('Template de confirmation non trouvé');
        return;
      }

      // Préparer les variables pour le template
      const usagerName = reservation.usager || 'Usager non spécifié';
      const hotelName = reservation.hotel || 'Hôtel non spécifié';
      const chambreNum = reservation.chambre || 'Non spécifiée';
      
      const variables = {
        usager: usagerName,
        hotel: hotelName,
        chambre: chambreNum,
        dateArrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        dateDepart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        prix: reservation.prix.toString(),
        prescripteur: reservation.prescripteur || 'Non spécifié',
        conditions: 'Conditions standard'
      };

      // TODO: Implémenter la génération de PDF
      // Generating PDF for reservation
      // Using confirmation template
      // Processing template variables
      
      // Simulation de génération de PDF
      alert('Fonctionnalité de génération de PDF à implémenter');

      // Mettre à jour le statut de la réservation
      if (onUpdateReservation) {
        onUpdateReservation({ ...reservation, statut: 'confirmed' });
      }

    } catch (error) {
      // Error occurred during confirmation
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleProlongReservation = async (reservation: Reservation) => {
    if (onProlongReservation) {
      onProlongReservation(reservation);
    }
  };

  const handleEndCareReservation = async (reservation: Reservation) => {
    if (onEndCare) {
      onEndCare(reservation);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Réservations</span>
              <Badge variant="secondary">{filteredReservations.length}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres et recherche */}
          <div className="space-y-4 mb-6">
            {/* Barre de recherche principale */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom de personne, établissement ou prescripteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres avancés
                  {showFilters && <Badge variant="secondary" className="ml-1">3</Badge>}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setHotelFilter('all');
                    setDateFilter('all');
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                {/* Filtre par statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="pending">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                {/* Filtre par type de prescripteur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de prescripteur</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les types</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="association">Association</option>
                    <option value="institution">Institution</option>
                    <option value="particulier">Particulier</option>
                  </select>
                </div>

                {/* Filtre par hôtel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Établissement</label>
                  <select
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les établissements</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.nom}>{hotel.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre par date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="current">En cours</option>
                    <option value="past">Passées</option>
                  </select>
                </div>
              </div>
            )}

            {/* Résumé des filtres actifs */}
            {(statusFilter !== 'all' || typeFilter !== 'all' || hotelFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Filtres actifs :</span>
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Statut: {statusFilter}
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Type: {typeFilter}
                  </Badge>
                )}
                {hotelFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Établissement: {hotelFilter}
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Période: {dateFilter}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Tableau des réservations */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Usager</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Établissement</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Chambre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Dates</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prescripteur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prix</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Processus</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  const processusReservation = getProcessusForReservation(reservation.id);
                  return (
                    <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div className="font-medium text-gray-900">
                            {reservation.usager || 'Usager non spécifié'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">
                            {reservation.hotel || 'Hôtel non spécifié'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {reservation.chambre || 'Non spécifiée'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {new Date(reservation.dateArrivee).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-gray-500">
                            {new Date(reservation.dateDepart).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {reservation.duree} jour(s)
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">{reservation.prescripteur || 'Non spécifié'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="font-medium text-gray-900">{reservation.prix}€</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(reservation.statut)}>
                          {reservation.statut}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {processusReservation ? (
                          <div className="flex items-center space-x-2">
                            <Badge className={getProcessusStatusColor(processusReservation.statut)}>
                              {getProcessusStatusText(processusReservation.statut)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProcessus(processusReservation)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucun</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReservationSelect(reservation)}
                            className="h-8 w-8 p-0"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {reservation.statut === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirmReservation(reservation)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Confirmer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {onProlongReservation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProlongReservation(reservation)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="Prolonger"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {onEndCare && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEndCareReservation(reservation)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                              title="Fin de prise en charge"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {onCancelReservation && (reservation.statut === 'confirmed' || reservation.statut === 'pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCancelReservation(reservation)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Annuler la réservation"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Message si aucune réservation */}
          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || hotelFilter !== 'all' || dateFilter !== 'all'
                  ? 'Aucune réservation ne correspond aux critères de recherche.'
                  : 'Aucune réservation n\'a été créée pour le moment.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de processus */}
      {selectedProcessus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Détails du processus</h2>
              <Button variant="ghost" onClick={handleCloseProcessus}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <Badge className={getProcessusStatusColor(selectedProcessus.statut)}>
                    {getProcessusStatusText(selectedProcessus.statut)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priorité</label>
                  <Badge className={getPrioriteColor(selectedProcessus.priorite)}>
                    {getPrioriteText(selectedProcessus.priorite)}
                  </Badge>
                </div>
              </div>
              


              <div>
                <label className="block text-sm font-medium text-gray-700">Détails du processus</label>
                <p className="text-gray-900 mt-1">
                  Processus de réservation #{selectedProcessus.id} - Durée estimée: {selectedProcessus.dureeEstimee} jours
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Étapes</label>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Bon d'hébergement</span>
                    <Badge variant={selectedProcessus.etapes.bonHebergement.statut === 'valide' ? 'default' : 'secondary'}>
                      {selectedProcessus.etapes.bonHebergement.statut}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Bon de commande</span>
                    <Badge variant={selectedProcessus.etapes.bonCommande.statut === 'valide' ? 'default' : 'secondary'}>
                      {selectedProcessus.etapes.bonCommande.statut}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Facture</span>
                    <Badge variant={selectedProcessus.etapes.facture.statut === 'payee' ? 'default' : 'secondary'}>
                      {selectedProcessus.etapes.facture.statut}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de début</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedProcessus.dateDebut).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                  <p className="text-gray-900 mt-1">
                    {selectedProcessus.dateFin ? new Date(selectedProcessus.dateFin).toLocaleDateString('fr-FR') : 'En cours'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
