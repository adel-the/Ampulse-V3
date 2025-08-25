"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Building2, 
  Edit, 
  ArrowLeft,
  Users,
  TrendingUp,
  Star,
  FileText,
  Euro,
  Percent,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { OperateurSocial, ConventionPrix, Hotel } from '../../types';
import { ConventionModal } from '../modals/Modals';
import ConventionDetail from './ConventionDetail';
import ConventionEditPage from './ConventionEditPage';

interface OperateurDetailProps {
  operateur: OperateurSocial;
  conventions: ConventionPrix[];
  hotels: Hotel[];
  onBack: () => void;
  onEditOperateur: (operateur: OperateurSocial) => void;
  onEditConvention: (convention: ConventionPrix) => void;
}

export default function OperateurDetail({ operateur, conventions, hotels, onBack, onEditOperateur, onEditConvention }: OperateurDetailProps) {
  const [recentReservations] = useState([
    { id: 1, usager: "Jean Dubois", hotel: "Résidence Saint-Martin", date: "15/12/2024", statut: "Confirmée" },
    { id: 2, usager: "Marie Martin", hotel: "Foyer Solidaire Belleville", date: "14/12/2024", statut: "En cours" },
    { id: 3, usager: "Pierre Bernard", hotel: "Hôtel d'Accueil Républicain", date: "13/12/2024", statut: "Terminée" },
    { id: 4, usager: "Sophie Thomas", hotel: "Centre d'Hébergement Voltaire", date: "12/12/2024", statut: "Confirmée" },
  ]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [conventionToEdit, setConventionToEdit] = useState<ConventionPrix | null>(null);
  const [viewConvention, setViewConvention] = useState<ConventionPrix | null>(null);
  const [editConvention, setEditConvention] = useState<ConventionPrix | null>(null);

  const operateurConventions = conventions.filter(c => c.operateurId === operateur.id);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReservationStatusColor = (statut: string) => {
    switch (statut) {
      case 'Confirmée': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Terminée': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConventionStatusColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiree': return 'bg-red-100 text-red-800';
      case 'suspendue': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConventionStatusText = (statut: string) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'expiree': return 'Expirée';
      case 'suspendue': return 'Suspendue';
      default: return statut;
    }
  };

  const activeConventions = operateurConventions.filter(c => c.statut === 'active');
  const totalSavings = operateurConventions.reduce((sum, c) => sum + (c.prixStandard - c.prixConventionne), 0);

  const handleEditClick = (convention: ConventionPrix) => {
    setConventionToEdit(convention);
    setEditModalOpen(true);
  };

  const handleEditSubmit = (updated: Partial<ConventionPrix>) => {
    if (conventionToEdit) {
      onEditConvention({ ...conventionToEdit, ...updated });
      setEditModalOpen(false);
      setConventionToEdit(null);
    }
  };

  if (editConvention) {
    const hotel = hotels.find(h => h.id === editConvention.hotelId);
    return (
      <ConventionEditPage
        convention={editConvention}
        hotel={hotel}
        operateur={operateur}
        onBack={() => setEditConvention(null)}
        onSave={handleEditSubmit}
      />
    );
  }

  if (viewConvention) {
    const hotel = hotels.find(h => h.id === viewConvention.hotelId);
    return (
      <ConventionDetail
        convention={viewConvention}
        hotel={hotel}
        operateur={operateur}
        onBack={() => setViewConvention(null)}
        onEdit={handleEditClick}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{operateur.prenom} {operateur.nom}</h1>
            <p className="text-gray-600">Détails de l'opérateur social</p>
          </div>
        </div>
        <Button onClick={() => onEditOperateur(operateur)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Réservations totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{operateur.nombreReservations}</div>
            <p className="text-xs text-gray-500">Réservations effectuées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taux de réussite
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-gray-500">Réservations confirmées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Conventions actives
            </CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeConventions.length}</div>
            <p className="text-xs text-gray-500">Établissements partenaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Économies totales
            </CardTitle>
            <Euro className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalSavings}€</div>
            <p className="text-xs text-gray-500">Grâce aux conventions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Évaluation
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">4.8/5</div>
            <p className="text-xs text-gray-500">Note moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Informations de contact et organisation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{operateur.prenom} {operateur.nom}</p>
                <p className="text-sm text-gray-600">Opérateur social</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{operateur.organisation}</p>
                <p className="text-sm text-gray-600">Organisation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{operateur.zoneIntervention}</p>
                <p className="text-sm text-gray-600">Zone d'intervention</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{operateur.specialite}</p>
                <p className="text-sm text-gray-600">Spécialité</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact et statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <p className="text-gray-900">{operateur.telephone}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <p className="text-gray-900">{operateur.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <p className="text-gray-900">Membre depuis le {operateur.dateCreation}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(operateur.statut)}>
                {operateur.statut === 'actif' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            {operateur.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{operateur.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conventions de prix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conventions de prix par établissement</CardTitle>
          <Badge variant="secondary">{operateurConventions.length} conventions</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Établissement</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type de chambre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tarifs mensuels</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prix standard</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prix conventionné</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Réduction</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Validité</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Conditions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operateurConventions.map((convention) => (
                  <tr key={convention.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{convention.hotelNom}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{convention.typeChambre}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {convention.tarifsMensuels ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">Tarifs personnalisés</div>
                            {Object.entries(convention.tarifsMensuels).slice(0, 3).map(([mois, tarifs]) => (
                              <div key={mois} className="text-xs text-gray-500">
                                {mois}: {tarifs.prixParPersonne ? `${tarifs.prixParPersonne}€/pers` : ''} {tarifs.prixParChambre ? `${tarifs.prixParChambre}€/ch` : ''}
                              </div>
                            ))}
                            {Object.keys(convention.tarifsMensuels).length > 3 && (
                              <div className="text-xs text-blue-600">+{Object.keys(convention.tarifsMensuels).length - 3} autres mois</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Tarification standard</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Euro className="h-3 w-3 mr-1" />
                        {convention.prixStandard}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm font-medium text-green-600">
                        <Euro className="h-3 w-3 mr-1" />
                        {convention.prixConventionne}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-orange-600">
                        <Percent className="h-3 w-3 mr-1" />
                        -{convention.reduction}%
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        <div>Du {convention.dateDebut}</div>
                        {convention.dateFin && (
                          <div>Au {convention.dateFin}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getConventionStatusColor(convention.statut)}>
                        {getConventionStatusText(convention.statut)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        {convention.conditionsSpeciales ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1 text-blue-500" />
                            {convention.conditionsSpeciales}
                          </div>
                        ) : convention.conditions ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
                            {convention.conditions}
                          </div>
                        ) : (
                          <span className="text-gray-400">Aucune condition</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditConvention(convention)}>
                          <Edit className="h-4 w-4 mr-1" /> Modifier
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setViewConvention(convention)}>
                          <Eye className="h-4 w-4" /> Voir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modale d'édition de convention */}
      <ConventionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        isLoading={false}
        convention={conventionToEdit || undefined}
        hotels={hotels}
        operateurs={[operateur]}
        mode="edit"
      />

      {/* Réservations récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Usager</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Établissement</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <div className="font-medium text-gray-900">{reservation.usager}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{reservation.hotel}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">{reservation.date}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getReservationStatusColor(reservation.statut)}>
                        {reservation.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
