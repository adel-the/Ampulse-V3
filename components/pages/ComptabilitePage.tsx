import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Calculator,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  CreditCard,
  Banknote,
  Check,
  Building,
  BarChart3,
  Users,
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Hotel } from '../../types';

interface ComptabilitePageProps {
  hotels: Hotel[];
  selectedHotelId?: number;
  activeSubTab?: string; // Sous-onglet actif
}

// Interfaces pour les journaux comptables
interface JournalEntry {
  id: number;
  date: string;
  type: 'caisse' | 'ventes' | 'cloture';
  description: string;
  montant: number;
  moyenPaiement: 'especes' | 'cb' | 'cheque' | 'virement' | 'carte_cadeau' | 'ota';
  statut: 'en_attente' | 'valide' | 'annule';
  hotelId: number;
}

// Interfaces pour la facturation et paiements
interface Invoice {
  id: number;
  numero: string;
  type: 'standard' | 'proforma' | 'groupe';
  dateEmission: string;
  dateEcheance: string;
  client: string;
  montant: number;
  tva: number;
  statut: 'brouillon' | 'emise' | 'payee' | 'en_retard' | 'partiel';
  hotelId: number;
}

interface Payment {
  id: number;
  factureId: number;
  date: string;
  montant: number;
  moyenPaiement: 'especes' | 'cb' | 'virement' | 'carte_cadeau' | 'ota';
  statut: 'en_attente' | 'valide' | 'annule';
  reference: string;
}

// Interfaces pour la comptabilité analytique
interface CostCenter {
  id: number;
  nom: string;
  type: 'hebergement' | 'restauration' | 'spa' | 'taxe_sejour';
  budget: number;
  depenses: number;
  revenus: number;
  marge: number;
}

// Interfaces pour les exports comptables
interface ExportFormat {
  id: number;
  nom: string;
  format: 'csv' | 'xml' | 'fec' | 'sage' | 'ebp';
  description: string;
  compatible: boolean;
}

// Interfaces pour TVA et taxes
interface TVARate {
  id: number;
  nom: string;
  taux: number;
  type: 'hebergement' | 'restauration' | 'divers';
  actif: boolean;
}

interface TaxeSejour {
  id: number;
  periode: string;
  montant: number;
  type: 'reel' | 'forfaitaire';
  statut: 'en_cours' | 'declare' | 'payee';
}

// Interfaces pour les comptes clients
interface ClientAccount {
  id: number;
  nom: string;
  type: 'entreprise' | 'agence' | 'particulier';
  solde: number;
  encours: number;
  derniereRelance: string;
  statut: 'actif' | 'suspendu' | 'bloque';
}

// Données de fallback pour les journaux comptables
const fallbackJournalEntries: JournalEntry[] = [
  {
    id: 1,
    date: '2024-01-15',
    type: 'caisse',
    description: 'Paiement chambre 101 - Espèces',
    montant: 450,
    moyenPaiement: 'especes',
    statut: 'valide',
    hotelId: 1
  },
  {
    id: 2,
    date: '2024-01-15',
    type: 'caisse',
    description: 'Paiement chambre 205 - CB',
    montant: 630,
    moyenPaiement: 'cb',
    statut: 'valide',
    hotelId: 1
  },
  {
    id: 3,
    date: '2024-01-15',
    type: 'ventes',
    description: 'Vente restaurant - Chèque',
    montant: 85,
    moyenPaiement: 'cheque',
    statut: 'valide',
    hotelId: 1
  }
];

// Données de fallback pour la facturation
const fallbackInvoices: Invoice[] = [
  {
    id: 1,
    numero: 'FAC-2024-001',
    type: 'standard',
    dateEmission: '2024-01-15',
    dateEcheance: '2024-02-15',
    client: 'Association Solidarité',
    montant: 450,
    tva: 75,
    statut: 'payee',
    hotelId: 1
  },
  {
    id: 2,
    numero: 'FAC-2024-002',
    type: 'proforma',
    dateEmission: '2024-01-18',
    dateEcheance: '2024-02-18',
    client: 'CCAS',
    montant: 630,
    tva: 105,
    statut: 'emise',
    hotelId: 1
  }
];

// Données de fallback pour les centres de coût
const fallbackCostCenters: CostCenter[] = [
  {
    id: 1,
    nom: 'Hébergement',
    type: 'hebergement',
    budget: 50000,
    depenses: 35000,
    revenus: 75000,
    marge: 40000
  },
  {
    id: 2,
    nom: 'Restauration',
    type: 'restauration',
    budget: 15000,
    depenses: 12000,
    revenus: 25000,
    marge: 13000
  }
];

// Données de fallback pour les formats d'export
const fallbackExportFormats: ExportFormat[] = [
  {
    id: 1,
    nom: 'Fichier des Écritures Comptables (FEC)',
    format: 'fec',
    description: 'Format standard pour l\'administration fiscale',
    compatible: true
  },
  {
    id: 2,
    nom: 'Sage Comptabilité',
    format: 'sage',
    description: 'Export compatible Sage',
    compatible: true
  }
];

// Données de fallback pour les taux de TVA
const fallbackTVARates: TVARate[] = [
  {
    id: 1,
    nom: 'TVA Hébergement',
    taux: 10,
    type: 'hebergement',
    actif: true
  },
  {
    id: 2,
    nom: 'TVA Restauration',
    taux: 20,
    type: 'restauration',
    actif: true
  }
];

// Données de fallback pour les comptes clients
const fallbackClientAccounts: ClientAccount[] = [
  {
    id: 1,
    nom: 'Association Solidarité',
    type: 'entreprise',
    solde: 0,
    encours: 0,
    derniereRelance: '2024-01-10',
    statut: 'actif'
  },
  {
    id: 2,
    nom: 'CCAS Lyon',
    type: 'agence',
    solde: 1250,
    encours: 1250,
    derniereRelance: '2024-01-15',
    statut: 'actif'
  }
];

export default function ComptabilitePage({ hotels, selectedHotelId, activeSubTab = 'comptabilite-journaux' }: ComptabilitePageProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Mapper les sous-onglets du menu principal vers les onglets internes
    switch (activeSubTab) {
      case 'comptabilite-journaux':
        return 'comptabilite-journaux';
      case 'comptabilite-facturation-paiements':
        return 'comptabilite-facturation-paiements';
      case 'comptabilite-analytique':
        return 'comptabilite-analytique';
      case 'comptabilite-exports':
        return 'comptabilite-exports';
      case 'comptabilite-tva-taxes':
        return 'comptabilite-tva-taxes';
      case 'comptabilite-clients':
        return 'comptabilite-clients';
      default:
        return 'comptabilite-journaux';
    }
  });
  
  // Synchroniser l'onglet actif quand activeSubTab change
  useEffect(() => {
    switch (activeSubTab) {
      case 'comptabilite-journaux':
        setActiveTab('comptabilite-journaux');
        break;
      case 'comptabilite-facturation-paiements':
        setActiveTab('comptabilite-facturation-paiements');
        break;
      case 'comptabilite-analytique':
        setActiveTab('comptabilite-analytique');
        break;
      case 'comptabilite-exports':
        setActiveTab('comptabilite-exports');
        break;
      case 'comptabilite-tva-taxes':
        setActiveTab('comptabilite-tva-taxes');
        break;
      case 'comptabilite-clients':
        setActiveTab('comptabilite-clients');
        break;
      default:
        setActiveTab('comptabilite-journaux');
    }
  }, [activeSubTab]);
  
  // États pour les différentes sections
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(fallbackJournalEntries);
  const [invoices, setInvoices] = useState<Invoice[]>(fallbackInvoices);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(fallbackCostCenters);
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>(fallbackExportFormats);
  const [tvaRates, setTvaRates] = useState<TVARate[]>(fallbackTVARates);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>(fallbackClientAccounts);
  const [loading, setLoading] = useState(false);

  const renderJournauxComptables = () => {
    const totalCaisse = journalEntries
      .filter(entry => entry.type === 'caisse')
      .reduce((sum, entry) => sum + entry.montant, 0);
    
    const totalVentes = journalEntries
      .filter(entry => entry.type === 'ventes')
      .reduce((sum, entry) => sum + entry.montant, 0);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Journaux Comptables</h2>
          <p className="text-gray-600">Gérez vos journaux de caisse, ventes et clôtures comptables.</p>
        </div>

        {/* Tableau de bord des journaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Journal de Caisse</p>
                <p className="text-2xl font-bold text-blue-600">{totalCaisse.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Journal des Ventes</p>
                <p className="text-2xl font-bold text-green-600">{totalVentes.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clôture Journalière</p>
                <p className="text-2xl font-bold text-purple-600">En attente</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle écriture
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Clôturer journal
            </button>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option value="caisse">Journal de caisse</option>
              <option value="ventes">Journal des ventes</option>
              <option value="cloture">Clôture</option>
            </select>
          </div>
        </div>

        {/* Tableau des écritures */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Écritures comptables</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moyen de paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journalEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === 'caisse' ? 'bg-blue-100 text-blue-800' :
                        entry.type === 'ventes' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.type === 'caisse' ? 'Caisse' :
                         entry.type === 'ventes' ? 'Ventes' : 'Clôture'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.moyenPaiement === 'especes' ? 'Espèces' :
                       entry.moyenPaiement === 'cb' ? 'Carte bancaire' :
                       entry.moyenPaiement === 'cheque' ? 'Chèque' :
                       entry.moyenPaiement === 'virement' ? 'Virement' :
                       entry.moyenPaiement === 'carte_cadeau' ? 'Carte cadeau' : 'OTA'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.montant.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.statut === 'valide' ? 'bg-green-100 text-green-800' :
                        entry.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.statut === 'valide' ? 'Validé' :
                         entry.statut === 'en_attente' ? 'En attente' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFacturationPaiements = () => {
    const totalEmises = invoices.filter(inv => inv.statut === 'emise').reduce((sum, inv) => sum + inv.montant, 0);
    const totalPayees = invoices.filter(inv => inv.statut === 'payee').reduce((sum, inv) => sum + inv.montant, 0);
    const totalEnRetard = invoices.filter(inv => inv.statut === 'en_retard').reduce((sum, inv) => sum + inv.montant, 0);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Facturation & Paiements</h2>
          <p className="text-gray-600">Gérez vos factures, paiements et encaissements.</p>
        </div>

        {/* Statistiques de facturation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Factures émises</p>
                <p className="text-2xl font-bold text-blue-600">{totalEmises.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Factures payées</p>
                <p className="text-2xl font-bold text-green-600">{totalPayees.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-red-600">{totalEnRetard.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encaissements</p>
                <p className="text-2xl font-bold text-purple-600">En cours</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Enregistrer paiement
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option value="standard">Standard</option>
              <option value="proforma">Proforma</option>
              <option value="groupe">Groupe</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="emise">Émise</option>
              <option value="payee">Payée</option>
              <option value="en_retard">En retard</option>
              <option value="partiel">Partiel</option>
            </select>
          </div>
        </div>

        {/* Tableau des factures */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Factures & Paiements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date émission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.type === 'standard' ? 'bg-blue-100 text-blue-800' :
                        invoice.type === 'proforma' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {invoice.type === 'standard' ? 'Standard' :
                         invoice.type === 'proforma' ? 'Proforma' : 'Groupe'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.dateEmission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.dateEcheance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(invoice.montant - invoice.tva).toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.tva.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.statut === 'payee' ? 'bg-green-100 text-green-800' :
                        invoice.statut === 'emise' ? 'bg-blue-100 text-blue-800' :
                        invoice.statut === 'en_retard' ? 'bg-red-100 text-red-800' :
                        invoice.statut === 'partiel' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.statut === 'payee' ? 'Payée' :
                         invoice.statut === 'emise' ? 'Émise' :
                         invoice.statut === 'en_retard' ? 'En retard' :
                         invoice.statut === 'partiel' ? 'Partiel' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900">
                          <CreditCard className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderComptabiliteAnalytique = () => {
    const totalBudget = costCenters.reduce((sum, center) => sum + center.budget, 0);
    const totalRevenus = costCenters.reduce((sum, center) => sum + center.revenus, 0);
    const totalDepenses = costCenters.reduce((sum, center) => sum + center.depenses, 0);
    const totalMarge = costCenters.reduce((sum, center) => sum + center.marge, 0);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comptabilité Analytique</h2>
          <p className="text-gray-600">Analysez vos performances par centre de coût et canal de vente.</p>
        </div>

        {/* Tableau de bord analytique */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget total</p>
                <p className="text-2xl font-bold text-blue-600">{totalBudget.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-2xl font-bold text-green-600">{totalRevenus.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">{totalDepenses.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Marge totale</p>
                <p className="text-2xl font-bold text-purple-600">{totalMarge.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau centre de coût
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter rapport
            </button>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option value="hebergement">Hébergement</option>
              <option value="restauration">Restauration</option>
              <option value="spa">Spa</option>
              <option value="taxe_sejour">Taxe de séjour</option>
            </select>
          </div>
        </div>

        {/* Tableau des centres de coût */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Centres de coût</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centre de coût</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dépenses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costCenters.map((center) => (
                  <tr key={center.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {center.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        center.type === 'hebergement' ? 'bg-blue-100 text-blue-800' :
                        center.type === 'restauration' ? 'bg-green-100 text-green-800' :
                        center.type === 'spa' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {center.type === 'hebergement' ? 'Hébergement' :
                         center.type === 'restauration' ? 'Restauration' :
                         center.type === 'spa' ? 'Spa' : 'Taxe de séjour'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {center.budget.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {center.depenses.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {center.revenus.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {center.marge.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderExportsComptables = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Exports Comptables</h2>
          <p className="text-gray-600">Exportez vos données vers votre logiciel comptable.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurer plan de comptes
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter FEC
            </button>
          </div>
        </div>

        {/* Tableau des formats d'export */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Formats d'export disponibles</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compatibilité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exportFormats.map((format) => (
                  <tr key={format.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        format.compatible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {format.compatible ? 'Compatible' : 'Non compatible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTVATaxes = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">TVA & Taxes</h2>
          <p className="text-gray-600">Gérez vos taux de TVA et taxes de séjour.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau taux TVA
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Déclaration TVA
            </button>
          </div>
        </div>

        {/* Tableau des taux de TVA */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Taux de TVA</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tvaRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rate.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rate.type === 'hebergement' ? 'bg-blue-100 text-blue-800' :
                        rate.type === 'restauration' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rate.type === 'hebergement' ? 'Hébergement' :
                         rate.type === 'restauration' ? 'Restauration' : 'Divers'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rate.taux}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rate.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rate.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderComptesClients = () => {
    const totalSolde = clientAccounts.reduce((sum, account) => sum + account.solde, 0);
    const totalEncours = clientAccounts.reduce((sum, account) => sum + account.encours, 0);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comptes Clients & Débiteurs</h2>
          <p className="text-gray-600">Gérez vos comptes clients et suivez les encours.</p>
        </div>

        {/* Tableau de bord clients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total solde</p>
                <p className="text-2xl font-bold text-blue-600">{totalSolde.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total encours</p>
                <p className="text-2xl font-bold text-red-600">{totalEncours.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                <p className="text-2xl font-bold text-green-600">{clientAccounts.filter(c => c.statut === 'actif').length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau compte
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter relances
            </button>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option value="entreprise">Entreprise</option>
              <option value="agence">Agence</option>
              <option value="particulier">Particulier</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="bloque">Bloqué</option>
            </select>
          </div>
        </div>

        {/* Tableau des comptes clients */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Comptes clients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière relance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.type === 'entreprise' ? 'bg-blue-100 text-blue-800' :
                        account.type === 'agence' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.type === 'entreprise' ? 'Entreprise' :
                         account.type === 'agence' ? 'Agence' : 'Particulier'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.solde.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {account.encours.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(account.derniereRelance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.statut === 'actif' ? 'bg-green-100 text-green-800' :
                        account.statut === 'suspendu' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {account.statut === 'actif' ? 'Actif' :
                         account.statut === 'suspendu' ? 'Suspendu' : 'Bloqué'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-orange-600 hover:text-orange-900">
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'comptabilite-journaux':
        return renderJournauxComptables();
      case 'comptabilite-facturation-paiements':
        return renderFacturationPaiements();
      case 'comptabilite-analytique':
        return renderComptabiliteAnalytique();
      case 'comptabilite-exports':
        return renderExportsComptables();
      case 'comptabilite-tva-taxes':
        return renderTVATaxes();
      case 'comptabilite-clients':
        return renderComptesClients();
      default:
        return renderJournauxComptables();
    }
  };

  return (
    <div className="px-6">
      {renderContent()}
    </div>
  );
} 