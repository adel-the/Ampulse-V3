import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Download, 
  Mail,
  Euro,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useState } from 'react';

interface Invoice {
  id: number;
  numero: string;
  clientId: number;
  clientNom: string;
  clientType: 'particulier' | 'entreprise' | 'association';
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string | null;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'brouillon' | 'emise' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  modePaiement: 'carte' | 'especes' | 'virement' | 'cheque' | null;
  notes: string;
  details: InvoiceDetail[];
  tauxTVA: number;
}

interface InvoiceDetail {
  id: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      numero: 'FAC-2024-001',
      clientId: 1,
      clientNom: 'Marie Dupont',
      clientType: 'particulier',
      dateEmission: '2024-01-15',
      dateEcheance: '2024-02-15',
      datePaiement: '2024-01-20',
      montantHT: 400,
      montantTVA: 80,
      montantTTC: 480,
      statut: 'payee',
      modePaiement: 'carte',
      notes: 'Séjour du 15 au 18 janvier 2024',
      tauxTVA: 20,
      details: [
        { id: 1, description: 'Chambre double - 3 nuits', quantite: 3, prixUnitaire: 65, montant: 195 },
        { id: 2, description: 'Petit-déjeuner continental', quantite: 3, prixUnitaire: 12, montant: 36 },
        { id: 3, description: 'WiFi Premium', quantite: 3, prixUnitaire: 5, montant: 15 },
        { id: 4, description: 'Parking sécurisé', quantite: 3, prixUnitaire: 8, montant: 24 },
        { id: 5, description: 'Service de chambre', quantite: 3, prixUnitaire: 0, montant: 0 }
      ]
    },
    {
      id: 2,
      numero: 'FAC-2024-002',
      clientId: 3,
      clientNom: 'TechCorp',
      clientType: 'entreprise',
      dateEmission: '2024-01-18',
      dateEcheance: '2024-02-18',
      datePaiement: null,
      montantHT: 2500,
      montantTVA: 500,
      montantTTC: 3000,
      statut: 'envoyee',
      modePaiement: null,
      notes: 'Réservation groupe - 5 chambres pour 10 nuits',
      tauxTVA: 20,
      details: [
        { id: 6, description: 'Chambres doubles - 10 nuits', quantite: 50, prixUnitaire: 45, montant: 2250 },
        { id: 7, description: 'Salle de réunion', quantite: 10, prixUnitaire: 25, montant: 250 }
      ]
    },
    {
      id: 3,
      numero: 'FAC-2024-003',
      clientId: 5,
      clientNom: 'Aide Sociale Plus',
      clientType: 'association',
      dateEmission: '2024-01-20',
      dateEcheance: '2024-02-20',
      datePaiement: '2024-01-25',
      montantHT: 1200,
      montantTVA: 0,
      montantTTC: 1200,
      statut: 'payee',
      modePaiement: 'virement',
      notes: 'Hébergement d\'urgence - tarif social',
      tauxTVA: 0,
      details: [
        { id: 8, description: 'Chambres adaptées - 5 nuits', quantite: 5, prixUnitaire: 30, montant: 150 },
        { id: 9, description: 'Chambres simples - 15 nuits', quantite: 15, prixUnitaire: 25, montant: 375 },
        { id: 10, description: 'Chambres doubles - 10 nuits', quantite: 10, prixUnitaire: 35, montant: 350 },
        { id: 11, description: 'Services sociaux', quantite: 30, prixUnitaire: 10, montant: 300 }
      ]
    },
    {
      id: 4,
      numero: 'FAC-2024-004',
      clientId: 2,
      clientNom: 'Jean Martin',
      clientType: 'particulier',
      dateEmission: '2024-01-22',
      dateEcheance: '2024-02-22',
      datePaiement: null,
      montantHT: 195,
      montantTVA: 39,
      montantTTC: 234,
      statut: 'en_retard',
      modePaiement: null,
      notes: 'Séjour d\'affaires - 3 nuits',
      tauxTVA: 20,
      details: [
        { id: 12, description: 'Chambre simple - 3 nuits', quantite: 3, prixUnitaire: 45, montant: 135 },
        { id: 13, description: 'WiFi Premium', quantite: 3, prixUnitaire: 5, montant: 15 },
        { id: 14, description: 'Parking sécurisé', quantite: 3, prixUnitaire: 8, montant: 24 },
        { id: 15, description: 'Service de chambre', quantite: 3, prixUnitaire: 0, montant: 0 }
      ]
    },
    {
      id: 5,
      numero: 'FAC-2024-005',
      clientId: 6,
      clientNom: 'Pierre Leroy',
      clientType: 'particulier',
      dateEmission: '2024-01-25',
      dateEcheance: '2024-02-25',
      datePaiement: '2024-01-26',
      montantHT: 600,
      montantTVA: 120,
      montantTTC: 720,
      statut: 'payee',
      modePaiement: 'carte',
      notes: 'Suite VIP - 2 nuits',
      tauxTVA: 20,
      details: [
        { id: 16, description: 'Suite - 2 nuits', quantite: 2, prixUnitaire: 120, montant: 240 },
        { id: 17, description: 'Service premium', quantite: 2, prixUnitaire: 50, montant: 100 },
        { id: 18, description: 'Transfert aéroport', quantite: 2, prixUnitaire: 35, montant: 70 },
        { id: 19, description: 'Mini-bar premium', quantite: 1, prixUnitaire: 20, montant: 20 }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Calculs globaux
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.statut === 'payee').length;
  const overdueInvoices = invoices.filter(inv => inv.statut === 'en_retard').length;
  const totalRevenue = invoices.filter(inv => inv.statut === 'payee').reduce((sum, inv) => sum + inv.montantTTC, 0);
  const pendingRevenue = invoices.filter(inv => inv.statut !== 'payee' && inv.statut !== 'annulee').reduce((sum, inv) => sum + inv.montantTTC, 0);
  const averageInvoiceAmount = totalInvoices > 0 ? (invoices.reduce((sum, inv) => sum + inv.montantTTC, 0) / totalInvoices).toFixed(0) : '0';

  // Filtrage
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.statut === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.clientType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'payee': return 'bg-green-100 text-green-800';
      case 'envoyee': return 'bg-blue-100 text-blue-800';
      case 'emise': return 'bg-yellow-100 text-yellow-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      case 'annulee': return 'bg-gray-100 text-gray-800';
      case 'brouillon': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'payee': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'envoyee': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'emise': return <FileText className="h-4 w-4 text-yellow-600" />;
      case 'en_retard': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'annulee': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'brouillon': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'particulier': return 'bg-blue-100 text-blue-800';
      case 'entreprise': return 'bg-orange-100 text-orange-800';
      case 'association': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.statut === 'payee' || invoice.statut === 'annulee') return false;
    return new Date() > new Date(invoice.dateEcheance);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des factures</h1>
        <Button onClick={() => setIsAddingInvoice(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouvelle facture</span>
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Factures émises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures payées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : '0'}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Factures impayées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus encaissés</CardTitle>
            <Euro className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">
              +{pendingRevenue.toLocaleString()}€ en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="payee">Payée</option>
              <option value="envoyee">Envoyée</option>
              <option value="emise">Émise</option>
              <option value="en_retard">En retard</option>
              <option value="annulee">Annulée</option>
              <option value="brouillon">Brouillon</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="particulier">Particulier</option>
              <option value="entreprise">Entreprise</option>
              <option value="association">Association</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className={`hover:shadow-lg transition-shadow ${isOverdue(invoice) ? 'border-red-200 bg-red-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>{invoice.numero}</span>
                    <Badge className={getStatusColor(invoice.statut)}>
                      {invoice.statut === 'payee' ? 'Payée' :
                       invoice.statut === 'envoyee' ? 'Envoyée' :
                       invoice.statut === 'emise' ? 'Émise' :
                       invoice.statut === 'en_retard' ? 'En retard' :
                       invoice.statut === 'annulee' ? 'Annulée' : 'Brouillon'}
                    </Badge>
                    {isOverdue(invoice) && (
                      <Badge className="bg-red-100 text-red-800">
                        En retard
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {invoice.clientNom} - {invoice.clientType.charAt(0).toUpperCase() + invoice.clientType.slice(1)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingInvoice(invoice)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Émission:</span>
                    <div className="font-semibold">{formatDate(invoice.dateEmission)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Échéance:</span>
                    <div className="font-semibold">{formatDate(invoice.dateEcheance)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Paiement:</span>
                    <div className="font-semibold">
                      {invoice.datePaiement ? formatDate(invoice.datePaiement) : 'En attente'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Montant TTC:</span>
                    <div className="font-semibold text-green-600">{invoice.montantTTC.toLocaleString()}€</div>
                  </div>
                </div>

                {/* Détails de la facture */}
                <div>
                  <span className="text-sm text-gray-500">Détails:</span>
                  <div className="mt-2 space-y-1">
                    {invoice.details.slice(0, 3).map((detail) => (
                      <div key={detail.id} className="flex justify-between text-sm">
                        <span>{detail.description}</span>
                        <span>{detail.montant}€</span>
                      </div>
                    ))}
                    {invoice.details.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{invoice.details.length - 3} autres lignes
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes et mode de paiement */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {invoice.notes}
                  </div>
                  <div className="text-right">
                    {invoice.modePaiement && (
                      <Badge variant="secondary" className="text-xs">
                        {invoice.modePaiement.charAt(0).toUpperCase() + invoice.modePaiement.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal d'ajout/édition (placeholder) */}
      {(isAddingInvoice || editingInvoice) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isAddingInvoice ? 'Nouvelle facture' : 'Modifier la facture'}
            </h2>
            <p className="text-gray-600 mb-4">
              Fonctionnalité en cours de développement...
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingInvoice(false);
                  setEditingInvoice(null);
                }}
              >
                Annuler
              </Button>
              <Button>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
