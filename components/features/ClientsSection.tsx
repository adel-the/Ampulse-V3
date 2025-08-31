'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, Plus, Users, Building, UserCheck, Filter, Eye, Edit, Trash2, 
  User, Phone, Mail, MapPin, Calendar, FileText, Download, MoreVertical, 
  RefreshCcw, Shield, Heart, UserPlus, Building2, ArrowLeft, Save, X,
  CreditCard, TestTube, RotateCcw, Euro, AlertCircle
} from 'lucide-react';
import { clientsApi, type ClientWithRelations, type ClientFormData } from '@/lib/api/clients';
import { usagersApi, type UsagerWithPrescripteur, type UsagerStats } from '@/lib/api/usagers';
import { conventionsApi } from '@/lib/api/conventions';
import { useNotifications } from '@/hooks/useNotifications';
import { CLIENT_TYPES } from '@/lib/supabase';
import type { Client, ClientCategory } from '@/lib/supabase';
import UsagerEditModal from '../modals/UsagerEditModal';
import ConfirmationDialog from '../ui/confirmation-dialog';
import ConventionPrix, { type ConventionPrixRef } from '../features/ConventionPrix';

interface ClientStats {
  total: number;
  actifs: number;
  inactifs: number;
  prospects: number;
  archives: number;
  particuliers: number;
  entreprises: number;
  associations: number;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function ClientsSection() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const conventionPrixRef = useRef<ConventionPrixRef>(null);
  
  // View state
  const [activeView, setActiveView] = useState<'prescripteurs' | 'usagers'>('prescripteurs');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  
  // Prescripteurs state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats>({
    total: 0,
    actifs: 0,
    inactifs: 0,
    prospects: 0,
    archives: 0,
    particuliers: 0,
    entreprises: 0,
    associations: 0
  });
  
  // Usagers state
  const [usagers, setUsagers] = useState<UsagerWithPrescripteur[]>([]);
  const [usagerStats, setUsagerStats] = useState<UsagerStats>({
    total: 0,
    actifs: 0,
    inactifs: 0,
    archives: 0
  });
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableViewMode, setTableViewMode] = useState<'grid' | 'table'>('table');
  
  // Prescripteur filters
  const [selectedType, setSelectedType] = useState<ClientCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Usager filters
  const [selectedPrescripteur, setSelectedPrescripteur] = useState<number | null>(null);
  const [selectedUsagerStatus, setSelectedUsagerStatus] = useState<string>('');
  
  // Modal states
  const [showUsagerEditModal, setShowUsagerEditModal] = useState(false);
  const [selectedUsager, setSelectedUsager] = useState<UsagerWithPrescripteur | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'client' | 'usager', item: any } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Referents state
  const [referents, setReferents] = useState<Array<{
    id?: number;
    nom: string;
    prenom: string;
    fonction: string;
    telephone: string;
    email: string;
    isEditing?: boolean;
  }>>([]);
  const [newReferent, setNewReferent] = useState({
    nom: '',
    prenom: '',
    fonction: '',
    telephone: '',
    email: ''
  });

  // Form state for prescripteur
  const [formData, setFormData] = useState<ClientFormData>({
    client_type: '' as any, // Empty to force selection
    nom: '',
    prenom: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    // Entreprise fields
    siret: '',
    nombre_employes: undefined,
    // Association fields
    numero_agrement: '',
    date_agrement: '',
    domaine_action: '',
    nombre_adherents: undefined,
    // Particulier fields
    lieu_naissance: '',
    nationalite: 'Française',
    profession: '',
    employeur: '',
    // Other
    statut: 'actif',
    source_acquisition: '',
    tags: [],
    notes: ''
  });
  const [activeFormTab, setActiveFormTab] = useState('informations');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formDirty, setFormDirty] = useState(false);
  const [testDataApplied, setTestDataApplied] = useState(false);
  
  // Convention pricing data state
  const [conventionPricingData, setConventionPricingData] = useState<any[]>([]);

  // Restore state from sessionStorage on component mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('clientsSectionState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setActiveView(state.activeView || 'prescripteurs');
        setSearchTerm(state.searchTerm || '');
        setSelectedType(state.selectedType || null);
        setSelectedStatus(state.selectedStatus || '');
        setSelectedPrescripteur(state.selectedPrescripteur || null);
        setSelectedUsagerStatus(state.selectedUsagerStatus || '');
        
        // Clear the saved state after restoring
        sessionStorage.removeItem('clientsSectionState');
      } catch (error) {
        console.error('Error restoring clients section state:', error);
      }
    }
  }, []);

  // Load data based on active view
  useEffect(() => {
    if (activeView === 'prescripteurs') {
      loadClients();
    } else {
      loadClients(); // Also load clients for prescripteur filter dropdown
      loadUsagers();
          }
  }, [activeView, selectedType, selectedStatus, selectedPrescripteur, selectedUsagerStatus]);

  // Load prescripteurs/clients
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.searchClients(searchTerm, selectedType || undefined, selectedStatus);
      if (response.success && response.data) {
        setClients(response.data);
        calculateClientStats(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des clients');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate client statistics
  const calculateClientStats = (clientList: Client[]) => {
    const newStats: ClientStats = {
      total: clientList.length,
      actifs: clientList.filter(c => c.statut === 'actif').length,
      inactifs: clientList.filter(c => c.statut === 'inactif').length,
      prospects: clientList.filter(c => c.statut === 'prospect').length,
      archives: 0,
      particuliers: clientList.filter(c => c.client_type === 'Particulier').length,
      entreprises: clientList.filter(c => c.client_type === 'Entreprise').length,
      associations: clientList.filter(c => c.client_type === 'Association').length
    };
    setClientStats(newStats);
  };

  // Load usagers
  const loadUsagers = async () => {
    setLoading(true);
    try {
      const response = await usagersApi.searchUsagers(
        searchTerm,
        selectedPrescripteur || undefined,
        selectedUsagerStatus || undefined
      );
      if (response.success && response.data) {
        setUsagers(response.data);
        // Calculate statistics after loading data
        setTimeout(() => calculateUsagerStats(), 0);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des usagers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate usager statistics from loaded data
  const calculateUsagerStats = () => {
    const stats = {
      total: usagers.length,
      actifs: usagers.filter(u => u.statut === 'actif').length,
      inactifs: usagers.filter(u => u.statut === 'inactif').length,
      archives: usagers.filter(u => u.statut === 'archive').length
    };
    setUsagerStats(stats);
  };

  // Handle search
  const handleSearch = () => {
    if (activeView === 'prescripteurs') {
      loadClients();
    } else {
      loadUsagers();
    }
  };

  // Initialize form data
  const initializeFormData = (client?: ClientWithRelations | null) => {
    if (client) {
      setFormData({
        client_type: client.client_type || 'Particulier',
        nom: client.nom || '',
        prenom: client.prenom || '',
        raison_sociale: client.raison_sociale || '',
        email: client.email || '',
        telephone: client.telephone || '',
        fax: (client as any).fax || '',
        site_web: (client as any).site_web || '',
        adresse: client.adresse || '',
        complement_adresse: (client as any).complement_adresse || '',
        ville: client.ville || '',
        code_postal: client.code_postal || '',
        pays: (client as any).pays || 'France',
        // Entreprise fields
        siret: client.siret || '',
        siren: (client as any).siren || '',
        tva_intracommunautaire: (client as any).tva_intracommunautaire || '',
        secteur_activite: (client as any).secteur_activite || '',
        taille_entreprise: (client as any).taille_entreprise || '',
        chiffre_affaires: (client as any).chiffre_affaires || undefined,
        nombre_employes: (client as any).nombre_employes || undefined,
        // Association fields
        numero_agrement: (client as any).numero_agrement || '',
        date_agrement: (client as any).date_agrement || '',
        domaine_action: (client as any).domaine_action || '',
        nombre_adherents: (client as any).nombre_adherents || undefined,
        // Particulier fields
        lieu_naissance: (client as any).lieu_naissance || '',
        nationalite: (client as any).nationalite || 'Française',
        profession: (client as any).profession || '',
        employeur: (client as any).employeur || '',
        // Other
        statut: client.statut || 'actif',
        source_acquisition: (client as any).source_acquisition || '',
        tags: (client as any).tags || [],
        notes: (client as any).notes || ''
      });
    } else {
      setFormData({
        client_type: '' as any, // Empty to force selection
        nom: '',
        prenom: '',
        raison_sociale: '',
        email: '',
        telephone: '',
        fax: '',
        site_web: '',
        adresse: '',
            ville: '',
        code_postal: '',
            // Entreprise fields
        siret: '',
        siren: '',
        tva_intracommunautaire: '',
        secteur_activite: '',
        taille_entreprise: '',
            nombre_employes: undefined,
        // Association fields
        numero_agrement: '',
        date_agrement: '',
        domaine_action: '',
        nombre_adherents: undefined,
        // Particulier fields
        lieu_naissance: '',
        nationalite: 'Française',
        profession: '',
        employeur: '',
        // Other
        statut: 'actif',
        source_acquisition: '',
        tags: [],
        notes: ''
      });
    }
    setFormErrors({});
    setFormDirty(false);
    setReferents([]);
    setNewReferent({
      nom: '',
      prenom: '',
      fonction: '',
      telephone: '',
      email: ''
    });
    // Reset convention pricing data
    setConventionPricingData([]);
  };

  // Handle create new client
  const handleCreateClient = () => {
    setSelectedClient(null);
    initializeFormData();
    setViewMode('create');
    setActiveFormTab('informations');
  };

  // Handle edit client
  const handleViewClient = async (client: Client) => {
    setFormLoading(true);
    try {
      const result = await clientsApi.getClientWithRelations(client.id);
      if (result.success && result.data) {
        setSelectedClient(result.data);
        initializeFormData(result.data);
        setViewMode('view');
        setActiveFormTab('informations');
      } else {
        addNotification('error', 'Erreur lors du chargement du client');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors du chargement du client');
    } finally {
      setFormLoading(false);
    }
  };

  // Function to transform database convention data to ConventionPrix component format
  const transformConventionData = (conventions: any[]) => {
    if (!conventions || conventions.length === 0) return [];
    
    // Group conventions by category
    const groupedByCategory = conventions.reduce((acc: any, convention: any) => {
      const categoryId = convention.category_id?.toString() || 'unknown';
      const categoryName = convention.room_categories?.name || 'Catégorie inconnue';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName,
          defaultPrice: convention.prix_defaut || 45,
          monthlyPrices: {},
          conditions: convention.conditions || ''
        };
      }
      
      // Transform monthly prices from database format to component format
      const monthMapping = {
        prix_janvier: 'janvier',
        prix_fevrier: 'fevrier', 
        prix_mars: 'mars',
        prix_avril: 'avril',
        prix_mai: 'mai',
        prix_juin: 'juin',
        prix_juillet: 'juillet',
        prix_aout: 'aout',
        prix_septembre: 'septembre',
        prix_octobre: 'octobre',
        prix_novembre: 'novembre',
        prix_decembre: 'decembre'
      };
      
      // Add monthly prices if they exist
      Object.entries(monthMapping).forEach(([dbField, componentField]) => {
        if (convention[dbField] && convention[dbField] > 0) {
          acc[categoryId].monthlyPrices[componentField] = convention[dbField];
        }
      });
      
      return acc;
    }, {});
    
    return Object.values(groupedByCategory);
  };

  const handleEditClient = async (client: Client) => {
    setFormLoading(true);
    try {
      const result = await clientsApi.getClientWithRelations(client.id);
      if (result.success && result.data) {
        setSelectedClient(result.data);
        initializeFormData(result.data);
        
        // Load existing referents
        if (result.data.referents && result.data.referents.length > 0) {
          setReferents(result.data.referents.map(ref => ({
            id: ref.id,
            nom: ref.nom || '',
            prenom: ref.prenom || '',
            fonction: ref.fonction || '',
            telephone: ref.telephone || '',
            email: ref.email || '',
            isEditing: false
          })));
        } else {
          setReferents([]);
        }
        
        // Load pricing conventions for Entreprise and Association
        if (result.data.id && (result.data.client_type === 'Entreprise' || result.data.client_type === 'Association')) {
          console.log('[ClientsSection] Loading conventions for client ID:', result.data.id);
          conventionsApi.getClientConventions(result.data.id).then(convResult => {
            console.log('[ClientsSection] Conventions API result:', convResult);
            if (convResult.success && convResult.data && convResult.data.length > 0) {
              console.log('[ClientsSection] Conventions loaded:', convResult.data);
              const transformedData = transformConventionData(convResult.data);
              console.log('[ClientsSection] Transformed data for ConventionPrix:', transformedData);
              setConventionPricingData(transformedData);
            } else {
              console.log('[ClientsSection] No conventions found for this client');
              setConventionPricingData([]);
            }
          }).catch(error => {
            console.error('[ClientsSection] Error loading conventions:', error);
            setConventionPricingData([]);
          });
        } else {
          console.log('[ClientsSection] Not loading conventions - Particulier or no ID');
          setConventionPricingData([]);
        }
        
        setViewMode('edit');
        setActiveFormTab('informations');
      } else {
        addNotification('error', 'Erreur lors du chargement du client');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors du chargement du client');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    if (formDirty) {
      setShowUnsavedChangesDialog(true);
    } else {
      setViewMode('list');
      setSelectedClient(null);
      initializeFormData();
    }
  };

  // Confirm discard changes
  const confirmDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    setViewMode('list');
    setSelectedClient(null);
    initializeFormData();
  };

  // Handle create new usager
  const handleCreateUsager = () => {
    setSelectedUsager(null);
    setShowUsagerEditModal(true);
  };

  // Handle edit usager
  const handleEditUsager = async (usager: UsagerWithPrescripteur) => {
    setSelectedUsager(usager);
    setShowUsagerEditModal(true);
  };

  // Handle delete
  const handleDelete = (type: 'client' | 'usager', item: any) => {
    setDeletingItem({ type, item });
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingItem) return;

    setDeleteLoading(true);
    try {
      let response;
      
      if (deletingItem.type === 'client') {
        response = await clientsApi.deleteClient(deletingItem.item.id);
      } else {
        response = await usagersApi.deleteUsager(deletingItem.item.id);
      }

      if (response.success) {
        addNotification('success', `${deletingItem.type === 'client' ? 'Client' : 'Usager'} supprimé avec succès`);
        if (deletingItem.type === 'client') {
          loadClients();
        } else {
          loadUsagers();
                  }
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
    }
  };

  // Get client display name
  const getClientDisplayName = (client: Client) => {
    if (client.client_type === 'Particulier') {
      return `${client.prenom || ''} ${client.nom || ''}`.trim();
    }
    return client.raison_sociale || client.nom || '';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'archive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // Get type icon
  const getTypeIcon = (clientType: ClientCategory) => {
    switch (clientType) {
      case 'Particulier': return User;
      case 'Entreprise': return Building;
      case 'Association': return Users;
      default: return User;
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check if client type is selected
    if (!formData.client_type) {
      newErrors.client_type = 'Veuillez sélectionner un type de client';
    }
    
    const isParticulier = formData.client_type === 'Particulier';

    // Required fields based on client type
    if (formData.client_type) {
      if (isParticulier) {
        if (!formData.nom) newErrors.nom = 'Le nom est obligatoire';
        if (!formData.prenom) newErrors.prenom = 'Le prénom est obligatoire';
      } else {
        if (!formData.raison_sociale) newErrors.raison_sociale = 'La raison sociale est obligatoire';
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Phone validation
    if (formData.telephone && !/^[0-9\s\-\+\.]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    // SIRET validation (14 digits for French companies)
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!validateForm()) {
      addNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setFormLoading(true);
    try {
      // Filter data to only include database fields
      const filteredClientData: any = {
        client_type: formData.client_type,
        nom: formData.nom,
        statut: formData.statut === 'archive' ? 'inactif' : (formData.statut || 'actif')
      };
      
      // Only add optional fields if they have values
      // Basic info
      if (formData.prenom?.trim()) filteredClientData.prenom = formData.prenom.trim();
      if (formData.raison_sociale?.trim()) filteredClientData.raison_sociale = formData.raison_sociale.trim();
      
      // Contact info
      if (formData.email?.trim()) filteredClientData.email = formData.email.trim();
      if (formData.telephone?.trim()) filteredClientData.telephone = formData.telephone.trim();
      if (formData.fax?.trim()) filteredClientData.fax = formData.fax.trim();
      if (formData.site_web?.trim()) filteredClientData.site_web = formData.site_web.trim();
      
      // Address
      if (formData.adresse?.trim()) filteredClientData.adresse = formData.adresse.trim();
      if (formData.complement_adresse?.trim()) filteredClientData.complement_adresse = formData.complement_adresse.trim();
      if (formData.ville?.trim()) filteredClientData.ville = formData.ville.trim();
      if (formData.code_postal?.trim()) filteredClientData.code_postal = formData.code_postal.trim();
      if (formData.pays?.trim()) filteredClientData.pays = formData.pays.trim();
      
      // Entreprise specific
      if (formData.siret?.trim()) filteredClientData.siret = formData.siret.trim();
      if (formData.siren?.trim()) filteredClientData.siren = formData.siren.trim();
      if (formData.tva_intracommunautaire?.trim()) filteredClientData.tva_intracommunautaire = formData.tva_intracommunautaire.trim();
      if (formData.secteur_activite?.trim()) filteredClientData.secteur_activite = formData.secteur_activite.trim();
      if (formData.taille_entreprise?.trim()) filteredClientData.taille_entreprise = formData.taille_entreprise.trim();
      if (formData.chiffre_affaires !== undefined && formData.chiffre_affaires !== null) filteredClientData.chiffre_affaires = formData.chiffre_affaires;
      if (formData.nombre_employes !== undefined && formData.nombre_employes !== null) filteredClientData.nombre_employes = formData.nombre_employes;
      
      // Association specific
      if (formData.numero_agrement?.trim()) filteredClientData.numero_agrement = formData.numero_agrement.trim();
      if (formData.date_agrement?.trim()) filteredClientData.date_agrement = formData.date_agrement.trim();
      if (formData.domaine_action?.trim()) filteredClientData.domaine_action = formData.domaine_action.trim();
      if (formData.nombre_adherents !== undefined && formData.nombre_adherents !== null) filteredClientData.nombre_adherents = formData.nombre_adherents;
      
      // Particulier specific
      if (formData.lieu_naissance?.trim()) filteredClientData.lieu_naissance = formData.lieu_naissance.trim();
      if (formData.nationalite?.trim()) filteredClientData.nationalite = formData.nationalite.trim();
      if (formData.profession?.trim()) filteredClientData.profession = formData.profession.trim();
      if (formData.employeur?.trim()) filteredClientData.employeur = formData.employeur.trim();
      
      // Other
      if (formData.source_acquisition?.trim()) filteredClientData.source_acquisition = formData.source_acquisition.trim();
      if (formData.tags && formData.tags.length > 0) filteredClientData.tags = formData.tags;
      if (formData.notes?.trim()) filteredClientData.notes = formData.notes.trim();
      
      let response;
      if (selectedClient?.id && viewMode === 'edit') {
        // Update existing client
        response = await clientsApi.updateClient(selectedClient.id, filteredClientData);
      } else {
        // Create new client
        response = await clientsApi.createClient(filteredClientData);
      }

      if (response.success && response.data?.id) {
        const clientId = response.data.id;
        
        // Save pricing conventions for Entreprise and Association
        if ((formData.client_type === 'Entreprise' || formData.client_type === 'Association') && 
            conventionPrixRef.current) {
          
          try {
            const pricingData = conventionPrixRef.current.getPricingData();
            const hasValidData = conventionPrixRef.current.validateData();
            
            if (hasValidData && pricingData.length > 0) {
              for (const categoryPricing of pricingData) {
                const cleanMonthlyPrices = () => {
                  const cleaned: Record<string, number> = {};
                  Object.entries(categoryPricing.monthlyPrices || {}).forEach(([month, price]) => {
                    if (price !== undefined && price > 0) {
                      cleaned[month] = price;
                    }
                  });
                  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
                };

                const validDefaultPrice = categoryPricing.defaultPrice && categoryPricing.defaultPrice > 0 ? categoryPricing.defaultPrice : null;
                
                if (!validDefaultPrice) continue;

                const conventionData = {
                  client_id: clientId,
                  category_id: parseInt(categoryPricing.categoryId),
                  hotel_id: 1, // TODO: Get selected hotel
                  date_debut: new Date().toISOString().split('T')[0],
                  date_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  prix_defaut: validDefaultPrice,
                  prix_mensuel: cleanMonthlyPrices(),
                  conditions: categoryPricing.conditions || '',
                  active: true
                };

                await conventionsApi.upsertConvention(conventionData);
              }
            }
          } catch (error) {
            console.error('Error saving conventions:', error);
          }
        }
        
        // Save referents
        if (referents.length > 0) {
          try {
            // If editing, delete existing referents first
            if (viewMode === 'edit' && selectedClient?.id) {
              const existingReferents = await clientsApi.getReferents(selectedClient.id);
              if (existingReferents.success && existingReferents.data) {
                for (const ref of existingReferents.data) {
                  if (ref.id) {
                    await clientsApi.deleteReferent(ref.id);
                  }
                }
              }
            }
            
            // Add new referents
            for (const referent of referents) {
              const referentData = {
                nom: referent.nom,
                prenom: referent.prenom || '',
                fonction: referent.fonction || '',
                telephone: referent.telephone || '',
                email: referent.email || ''
              };
              await clientsApi.createReferent(clientId, referentData);
            }
          } catch (error) {
            console.error('Error saving referents:', error);
          }
        }
        
        const actionText = viewMode === 'edit' ? 'modifié' : 'créé';
        addNotification('success', `Prescripteur ${actionText} avec succès`);
        
        // Refresh data and go back to list
        await loadClients();
        setViewMode('list');
        setSelectedClient(null);
        initializeFormData();
      } else {
        addNotification('error', response.error || 'Une erreur est survenue');
      }
    } catch (error) {
      addNotification('error', `Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Test data generation
  const getTestData = (clientType: ClientCategory) => {
    switch (clientType) {
      case 'Particulier':
        return {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
          telephone: '06 23 45 67 89',
          adresse: '42 Avenue des Champs',
          ville: 'Paris',
          code_postal: '75008',
          nombre_enfants: 2,
          notes: 'Client régulier, famille de 4 personnes'
        };
      case 'Entreprise':
        return {
          raison_sociale: 'Innov Tech SAS',
          nom: 'Moreau',
          prenom: 'Alexandre',
          siret: '98765432101234',
          email: 'contact@innovtech.fr',
          telephone: '01 23 45 67 89',
          adresse: '100 Rue de l\'Innovation',
          ville: 'Lyon',
          code_postal: '69002',
          secteur_activite: 'Technologies de l\'information',
          nombre_employes: 50,
          notes: 'Entreprise partenaire depuis 2022'
        };
      case 'Association':
        return {
          raison_sociale: 'Entraide et Solidarité',
          nom: 'Bernard',
          prenom: 'François',
          siret: '11223344556677',
          email: 'contact@entraide-solidarite.org',
          telephone: '03 12 34 56 78',
          adresse: '15 Place de la Solidarité',
          ville: 'Lille',
          code_postal: '59000',
          numero_agrement: 'AGR-2024-001',
          nombre_adherents: 150,
          notes: 'Association partenaire pour l\'hébergement social'
        };
      default:
        return {};
    }
  };

  const applyTestData = () => {
    const testData = getTestData(formData.client_type);
    setFormData(prev => ({
      ...prev,
      ...testData
    }));
    setTestDataApplied(true);
    setFormDirty(true);
    setTimeout(() => setTestDataApplied(false), 3000);
  };

  const clearForm = () => {
    initializeFormData(selectedClient);
  };

  // Render form view
  const renderFormView = () => {
    const isReadOnly = viewMode === 'view';
    const isParticulier = formData.client_type === 'Particulier';
    const isEntreprise = formData.client_type === 'Entreprise';
    const isAssociation = formData.client_type === 'Association';

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h2 className="text-2xl font-bold">
              {viewMode === 'create' && 'Nouveau prescripteur'}
              {viewMode === 'edit' && 'Modifier le prescripteur'}
              {viewMode === 'view' && 'Détails du prescripteur'}
            </h2>
          </div>
          {viewMode === 'view' && (
            <Button onClick={() => handleEditClient(selectedClient!)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>

        {/* Form Tabs */}
        <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations">Informations & Contact</TabsTrigger>
            <TabsTrigger value="referents">Référents</TabsTrigger>
            {(isEntreprise || isAssociation) && (
              <TabsTrigger value="conventions">Conventions</TabsTrigger>
            )}
          </TabsList>

          {/* Informations & Contact Tab */}
          <TabsContent value="informations">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales et contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations générales</h3>
                {/* Type de client */}
                <div>
                  <Label htmlFor="client_type">Type de client *</Label>
                  <select
                    id="client_type"
                    value={formData.client_type || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, client_type: e.target.value as ClientCategory }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sélectionnez un type --</option>
                    <option value="Particulier">Particulier</option>
                    <option value="Entreprise">Entreprise</option>
                    <option value="Association">Association</option>
                  </select>
                  {formErrors.client_type && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.client_type}</p>
                  )}
                </div>

                {/* Nom et prénom ou Raison sociale */}
                {isParticulier ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nom">Nom *</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, nom: e.target.value }));
                          setFormDirty(true);
                        }}
                        disabled={isReadOnly}
                        className={formErrors.nom ? 'border-red-500' : ''}
                      />
                      {formErrors.nom && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.nom}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="prenom">Prénom *</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, prenom: e.target.value }));
                          setFormDirty(true);
                        }}
                        disabled={isReadOnly}
                        className={formErrors.prenom ? 'border-red-500' : ''}
                      />
                      {formErrors.prenom && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.prenom}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="raison_sociale">Raison sociale *</Label>
                    <Input
                      id="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, raison_sociale: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                      className={formErrors.raison_sociale ? 'border-red-500' : ''}
                    />
                    {formErrors.raison_sociale && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.raison_sociale}</p>
                    )}
                  </div>
                )}

                {/* Entreprise specific fields */}
                {isEntreprise && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, siret: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                          className={formErrors.siret ? 'border-red-500' : ''}
                        />
                        {formErrors.siret && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.siret}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="tva_intracommunautaire">TVA Intracommunautaire</Label>
                        <Input
                          id="tva_intracommunautaire"
                          value={formData.tva_intracommunautaire}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, tva_intracommunautaire: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="secteur_activite">Secteur d'activité</Label>
                        <Input
                          id="secteur_activite"
                          value={formData.secteur_activite}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, secteur_activite: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taille_entreprise">Taille de l'entreprise</Label>
                        <select
                          id="taille_entreprise"
                          value={formData.taille_entreprise}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, taille_entreprise: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Sélectionnez --</option>
                          <option value="TPE">TPE (1-9)</option>
                          <option value="PME">PME (10-249)</option>
                          <option value="ETI">ETI (250-4999)</option>
                          <option value="GE">Grande entreprise (5000+)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre_employes">Nombre d'employés</Label>
                        <Input
                          id="nombre_employes"
                          type="number"
                          value={formData.nombre_employes || ''}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, nombre_employes: e.target.value ? parseInt(e.target.value) : undefined }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="chiffre_affaires">Chiffre d'affaires annuel (€)</Label>
                        <Input
                          id="chiffre_affaires"
                          type="number"
                          value={formData.chiffre_affaires || ''}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, chiffre_affaires: e.target.value ? parseFloat(e.target.value) : undefined }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Association specific fields */}
                {isAssociation && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, siret: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                          className={formErrors.siret ? 'border-red-500' : ''}
                        />
                        {formErrors.siret && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.siret}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="numero_agrement">Numéro d'agrément</Label>
                        <Input
                          id="numero_agrement"
                          value={formData.numero_agrement}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, numero_agrement: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_agrement">Date d'agrément</Label>
                        <Input
                          id="date_agrement"
                          type="date"
                          value={formData.date_agrement}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, date_agrement: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nombre_adherents">Nombre d'adhérents</Label>
                        <Input
                          id="nombre_adherents"
                          type="number"
                          value={formData.nombre_adherents || ''}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, nombre_adherents: e.target.value ? parseInt(e.target.value) : undefined }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="domaine_action">Domaine d'action</Label>
                      <Input
                        id="domaine_action"
                        value={formData.domaine_action}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, domaine_action: e.target.value }));
                          setFormDirty(true);
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                  </>
                )}

                {/* Particulier specific fields */}
                {isParticulier && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                        <Input
                          id="lieu_naissance"
                          value={formData.lieu_naissance}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, lieu_naissance: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationalite">Nationalité</Label>
                        <Input
                          id="nationalite"
                          value={formData.nationalite}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, nationalite: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profession">Profession</Label>
                        <Input
                          id="profession"
                          value={formData.profession}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, profession: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employeur">Employeur</Label>
                        <Input
                          id="employeur"
                          value={formData.employeur}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, employeur: e.target.value }));
                            setFormDirty(true);
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Status */}
                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <select
                    id="statut"
                    value={formData.statut}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, statut: e.target.value as 'actif' | 'inactif' | 'prospect' | 'archive' }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>

                </div>

                {/* Section Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mt-6">Informations de contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone fixe</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, telephone: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                      className={formErrors.telephone ? 'border-red-500' : ''}
                    />
                    {formErrors.telephone && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.telephone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fax">Fax</Label>
                    <Input
                      id="fax"
                      value={formData.fax}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, fax: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="site_web">Site web</Label>
                  <Input
                    id="site_web"
                    value={formData.site_web}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, site_web: e.target.value }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                    placeholder="https://"
                  />
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, adresse: e.target.value }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <Label htmlFor="complement_adresse">Complément d'adresse</Label>
                  <Input
                    id="complement_adresse"
                    value={formData.complement_adresse}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, complement_adresse: e.target.value }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                    placeholder="Bâtiment, étage, etc."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code_postal">Code postal</Label>
                    <Input
                      id="code_postal"
                      value={formData.code_postal}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, code_postal: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, ville: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pays">Pays</Label>
                    <Input
                      id="pays"
                      value={formData.pays}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, pays: e.target.value }));
                        setFormDirty(true);
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, notes: e.target.value }));
                      setFormDirty(true);
                    }}
                    disabled={isReadOnly}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referents Tab */}
          <TabsContent value="referents">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des référents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Les référents sont les personnes de contact associées à ce client.
                  </div>
                  
                  {/* Add referent form */}
                  {!isReadOnly && (
                    <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                      <h4 className="font-semibold">Ajouter un référent</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ref_nom">Nom *</Label>
                          <Input
                            id="ref_nom"
                            placeholder="Nom du référent"
                            value={newReferent.nom}
                            onChange={(e) => setNewReferent({...newReferent, nom: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ref_prenom">Prénom</Label>
                          <Input
                            id="ref_prenom"
                            placeholder="Prénom du référent"
                            value={newReferent.prenom}
                            onChange={(e) => setNewReferent({...newReferent, prenom: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ref_fonction">Fonction</Label>
                          <Input
                            id="ref_fonction"
                            placeholder="Directeur, Responsable, etc."
                            value={newReferent.fonction}
                            onChange={(e) => setNewReferent({...newReferent, fonction: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ref_telephone">Téléphone</Label>
                          <Input
                            id="ref_telephone"
                            placeholder="06 00 00 00 00"
                            value={newReferent.telephone}
                            onChange={(e) => setNewReferent({...newReferent, telephone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ref_email">Email</Label>
                        <Input
                          id="ref_email"
                          type="email"
                          placeholder="referent@example.com"
                          value={newReferent.email}
                          onChange={(e) => setNewReferent({...newReferent, email: e.target.value})}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (newReferent.nom.trim()) {
                            setReferents([...referents, {...newReferent, isEditing: false}]);
                            setNewReferent({
                              nom: '',
                              prenom: '',
                              fonction: '',
                              telephone: '',
                              email: ''
                            });
                            setFormDirty(true);
                          } else {
                            addNotification('error', 'Le nom du référent est obligatoire');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le référent
                      </Button>
                    </div>
                  )}

                  {/* List of referents */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Référents actuels</h4>
                    {referents.length > 0 ? (
                      <div className="space-y-2">
                        {referents.map((referent, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-white">
                            {referent.isEditing ? (
                              // Edit mode
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    value={referent.nom}
                                    onChange={(e) => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], nom: e.target.value};
                                      setReferents(updated);
                                    }}
                                    placeholder="Nom"
                                  />
                                  <Input
                                    value={referent.prenom}
                                    onChange={(e) => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], prenom: e.target.value};
                                      setReferents(updated);
                                    }}
                                    placeholder="Prénom"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    value={referent.fonction}
                                    onChange={(e) => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], fonction: e.target.value};
                                      setReferents(updated);
                                    }}
                                    placeholder="Fonction"
                                  />
                                  <Input
                                    value={referent.telephone}
                                    onChange={(e) => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], telephone: e.target.value};
                                      setReferents(updated);
                                    }}
                                    placeholder="Téléphone"
                                  />
                                </div>
                                <Input
                                  value={referent.email}
                                  onChange={(e) => {
                                    const updated = [...referents];
                                    updated[index] = {...updated[index], email: e.target.value};
                                    setReferents(updated);
                                  }}
                                  placeholder="Email"
                                  type="email"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], isEditing: false};
                                      setReferents(updated);
                                      setFormDirty(true);
                                    }}
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Enregistrer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updated = [...referents];
                                      updated[index] = {...updated[index], isEditing: false};
                                      setReferents(updated);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-semibold">
                                    {referent.nom} {referent.prenom}
                                  </div>
                                  {referent.fonction && (
                                    <div className="text-sm text-gray-600">{referent.fonction}</div>
                                  )}
                                  <div className="text-sm space-y-1 mt-2">
                                    {referent.telephone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {referent.telephone}
                                      </div>
                                    )}
                                    {referent.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {referent.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!isReadOnly && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const updated = [...referents];
                                        updated[index] = {...updated[index], isEditing: true};
                                        setReferents(updated);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setReferents(referents.filter((_, i) => i !== index));
                                        setFormDirty(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Aucun référent enregistré pour ce client.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conventions Tab for Entreprise/Association */}
          {(isEntreprise || isAssociation) && (
            <TabsContent value="conventions">
              <Card>
                <CardHeader>
                  <CardTitle>Conventions tarifaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConventionPrix
                    ref={conventionPrixRef}
                    initialData={conventionPricingData}
                    disabled={isReadOnly || formLoading}
                    showSaveButton={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex justify-end gap-2">
            {/* Test data button for development */}
            {viewMode === 'create' && (
              <>
                <Button
                  variant="outline"
                  onClick={applyTestData}
                  className="mr-auto"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Données de test
                </Button>
                {testDataApplied && (
                  <span className="text-green-600 text-sm flex items-center mr-auto">
                    ✓ Données de test appliquées
                  </span>
                )}
              </>
            )}
            
            <Button variant="outline" onClick={handleBackToList}>
              Annuler
            </Button>
            <Button onClick={handleFormSubmit} disabled={formLoading}>
              {formLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {viewMode === 'edit' ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Main render
  if (viewMode !== 'list') {
    return renderFormView();
  }

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'prescripteurs' | 'usagers')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="prescripteurs" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Prescripteurs
          </TabsTrigger>
          <TabsTrigger value="usagers" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Usagers (Bénéficiaires)
          </TabsTrigger>
        </TabsList>

        {/* Prescripteurs View */}
        <TabsContent value="prescripteurs">
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un prescripteur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedType || ''}
                    onChange={(e) => {
                      const newValue = e.target.value ? e.target.value as ClientCategory : null;
                      setSelectedType(newValue);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les types</option>
                    {CLIENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="prospect">Prospect</option>
                  </select>
                  
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                  
                  <Button onClick={handleCreateClient} className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau prescripteur
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des prescripteurs...</span>
              </div>
            ) : clients.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun prescripteur trouvé</h3>
                <p className="text-gray-600">Modifiez vos filtres ou créez un nouveau prescripteur</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescripteur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map(client => {
                          const TypeIcon = getTypeIcon(client.client_type || 'Particulier');
                          
                          return (
                            <tr key={client.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{getClientDisplayName(client)}</p>
                                  <p className="text-xs text-gray-500">{client.numero_client}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">{client.client_type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1 text-sm">
                                  {client.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-600">{client.email}</span>
                                    </div>
                                  )}
                                  {client.telephone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-600">{client.telephone}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {(client.ville || client.code_postal) && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">
                                      {client.code_postal} {client.ville}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(client.statut || 'actif')}>
                                  {client.statut || 'actif'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">
                                  {client.created_at && new Date(client.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewClient(client)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete('client', client)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Usagers View */}
        <TabsContent value="usagers">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total usagers</p>
                      <p className="text-2xl font-bold">{usagerStats.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Actifs</p>
                      <p className="text-2xl font-bold">{usagerStats.actifs}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un usager..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedPrescripteur || ''}
                    onChange={(e) => setSelectedPrescripteur(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les prescripteurs</option>
                    {clients
                      .filter(c => c.statut === 'actif')
                      .map(client => (
                        <option key={client.id} value={client.id}>
                          {client.client_type === 'Particulier' 
                            ? `${client.nom} ${client.prenom || ''}`.trim()
                            : client.raison_sociale || client.nom}
                        </option>
                      ))}
                  </select>
                  
                  <select
                    value={selectedUsagerStatus}
                    onChange={(e) => setSelectedUsagerStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="archive">Archivé</option>
                  </select>
                  
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                  
                  <Button onClick={handleCreateUsager} className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel usager
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des usagers...</span>
              </div>
            ) : usagers.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun usager trouvé</h3>
                <p className="text-gray-600">Modifiez vos filtres ou créez un nouvel usager</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usager</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescripteur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usagers.map(usager => (
                          <tr key={usager.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{usager.prenom} {usager.nom}</p>
                                <p className="text-xs text-gray-500">{usager.numero_usager}</p>
                                {usager.date_naissance && (
                                  <p className="text-xs text-gray-500">
                                    Né(e) le {new Date(usager.date_naissance).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {usager.prescripteur && (
                                <div className="flex items-center gap-2">
                                  {usager.prescripteur.client_type === 'Entreprise' ? (
                                    <Building className="h-4 w-4 text-gray-500" />
                                  ) : usager.prescripteur.client_type === 'Association' ? (
                                    <Users className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <User className="h-4 w-4 text-gray-500" />
                                  )}
                                  <div>
                                    <p className="text-sm">
                                      {usager.prescripteur.raison_sociale || 
                                       `${usager.prescripteur.prenom || ''} ${usager.prescripteur.nom || ''}`.trim()}
                                    </p>
                                    <p className="text-xs text-gray-500">{usager.prescripteur.client_type}</p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1 text-sm">
                                {usager.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{usager.email}</span>
                                  </div>
                                )}
                                {usager.telephone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{usager.telephone}</span>
                                  </div>
                                )}
                                {(usager as any).ville && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{(usager as any).ville}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {(usager as any).situation_familiale && (
                                  <p className="text-gray-600">{(usager as any).situation_familiale}</p>
                                )}
                                {(usager as any).nombre_enfants > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {(usager as any).nombre_enfants} enfant{(usager as any).nombre_enfants > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(usager.statut)}>
                                {usager.statut}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUsager(usager)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUsager(usager)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete('usager', usager)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
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
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Usager Edit Modal */}
      <UsagerEditModal
        isOpen={showUsagerEditModal}
        onClose={() => setShowUsagerEditModal(false)}
        usager={selectedUsager}
        prescripteurs={clients.filter(c => 
          c.statut === 'actif' && (
            c.client_type === 'Entreprise' || 
            c.client_type === 'Association' ||
            c.client_type === 'Particulier'
          )
        )}
        onSuccess={() => {
          loadUsagers();
                    setShowUsagerEditModal(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer ${deletingItem?.type === 'client' ? 'le prescripteur' : 'l\'usager'}`}
        message={`Êtes-vous sûr de vouloir supprimer ${
          deletingItem?.type === 'client' 
            ? getClientDisplayName(deletingItem.item) 
            : deletingItem?.item ? `${deletingItem.item.prenom} ${deletingItem.item.nom}` : ''
        } ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Unsaved Changes Dialog */}
      <ConfirmationDialog
        isOpen={showUnsavedChangesDialog}
        onClose={() => setShowUnsavedChangesDialog(false)}
        onConfirm={confirmDiscardChanges}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter sans sauvegarder ?"
        confirmText="Quitter sans sauvegarder"
        cancelText="Continuer l'édition"
      />
    </div>
  );
}