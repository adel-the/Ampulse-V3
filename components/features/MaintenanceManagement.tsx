"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useRooms, useMaintenanceTasks } from '@/hooks/useSupabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  Wrench, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Bed,
  Calendar,
  User,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Building,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

interface MaintenanceRoom {
  id: number;
  numero: string;
  hotel: string;
  status: 'maintenance' | 'reparation' | 'commande' | 'termine' | 'disponible' | 'occupee';
  dateDebut: string;
  dateFin?: string;
  description: string;
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  responsable?: string;
  coutEstime?: number;
  isMaintenanceRoom?: boolean; // Indique si c'est une vraie chambre en maintenance
}

interface MaintenanceItem {
  id: number;
  nom: string;
  description: string;
  categorie: 'plomberie' | 'electricite' | 'mobilier' | 'climatisation' | 'securite' | 'autre';
  coutMoyen: number;
  dureeMoyenne: number; // en heures
}

interface MaintenanceTodo {
  id: number;
  roomId: number;
  itemId: number;
  titre: string;
  description: string;
  status: 'a_faire' | 'en_cours' | 'termine';
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  dateCreation: string;
  dateEcheance?: string;
  responsable?: string;
  notes?: string;
}

interface MaintenanceManagementProps {
  selectedHotel?: {
    id: number;
    nom: string;
    chambresTotal: number;
    chambresOccupees: number;
    tauxOccupation: number;
  } | null;
}

export default function MaintenanceManagement({ selectedHotel }: MaintenanceManagementProps) {
  // Récupérer les vraies chambres de l'établissement sélectionné
  const { rooms: realRooms, loading: roomsLoading, error: roomsError, updateRoomStatus } = useRooms(selectedHotel?.id);
  const { addNotification } = useNotifications();
  
  // Récupérer les vraies tâches de maintenance
  const {
    tasks: maintenanceTasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    getTaskStatistics
  } = useMaintenanceTasks(selectedHotel?.id);
  
  const [maintenanceRooms, setMaintenanceRooms] = useState<MaintenanceRoom[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [todos, setTodos] = useState<MaintenanceTodo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les modales et formulaires
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MaintenanceRoom | null>(null);
  
  // Nouveaux états pour la navigation
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<MaintenanceRoom | null>(null);
  
  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les sections collapsibles
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // États pour les changements de statut
  const [roomUpdating, setRoomUpdating] = useState<Record<number, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    roomId?: number;
    currentStatus?: string;
    newStatus?: string;
  }>({ isOpen: false });

  // États pour les formulaires
  const [newRoom, setNewRoom] = useState({
    numero: '',
    description: '',
    priorite: 'moyenne' as const,
    responsable: '',
    coutEstime: 0
  });

  const [newItem, setNewItem] = useState({
    nom: '',
    description: '',
    categorie: 'autre' as const,
    coutMoyen: 0,
    dureeMoyenne: 1
  });

  const [newTodo, setNewTodo] = useState({
    titre: '',
    description: '',
    priorite: 'moyenne' as const,
    responsable: '',
    dateEcheance: '',
    notes: ''
  });

  // Fonctions utilitaires pour générer les données de maintenance
  const generateMaintenanceDescription = (roomNumber: string): string => {
    const descriptions = [
      'Problème de climatisation',
      'Réparation robinetterie',
      'Attente pièces détachées',
      'Maintenance électrique',
      'Rénovation salle de bain',
      'Changement revêtement sol',
      'Réparation fenêtre',
      'Maintenance chauffage'
    ];
    return descriptions[parseInt(roomNumber) % descriptions.length] || 'Maintenance générale';
  };

  const generatePriority = (index: number): 'basse' | 'moyenne' | 'haute' | 'critique' => {
    const priorities: ('basse' | 'moyenne' | 'haute' | 'critique')[] = ['haute', 'moyenne', 'basse', 'critique'];
    return priorities[index % priorities.length] || 'moyenne';
  };

  const generateResponsable = (index: number): string => {
    const responsables = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Dubois', 'Luc Moreau'];
    return responsables[index % responsables.length] || 'Non assigné';
  };

  // Traiter les vraies données de chambres - TOUTES les chambres
  useEffect(() => {
    const processRealRooms = () => {
      if (!realRooms) return;

      // Transformer toutes les chambres avec enrichissement pour celles en maintenance
      const allRoomsData: MaintenanceRoom[] = realRooms
        .map((room, index) => {
          const isMaintenanceRoom = room.statut === 'maintenance';
          
          const baseRoom = {
            id: room.id,
            numero: room.numero,
            hotel: selectedHotel?.nom || 'Établissement',
            status: room.statut as 'maintenance' | 'reparation' | 'commande' | 'termine' | 'disponible' | 'occupee',
            dateDebut: new Date().toISOString().split('T')[0],
            description: room.description || '',
            priorite: 'moyenne' as const,
            responsable: undefined,
            coutEstime: 0,
            isMaintenanceRoom
          };

          // Enrichir les données pour les chambres en maintenance
          if (isMaintenanceRoom) {
            return {
              ...baseRoom,
              description: room.description || generateMaintenanceDescription(room.numero),
              priorite: generatePriority(index),
              responsable: generateResponsable(index),
              coutEstime: Math.floor(Math.random() * 500) + 100
            };
          }

          // Pour les chambres disponibles et occupées, données basiques
          return {
            ...baseRoom,
            description: `Chambre ${room.statut === 'disponible' ? 'disponible' : 'occupée'} - ${room.category_id ? 'Catégorie définie' : 'Standard'}`,
            responsable: undefined
          };
        });

      setMaintenanceRooms(allRoomsData);

      const demoItems: MaintenanceItem[] = [
        {
          id: 1,
          nom: 'Réparation climatisation',
          description: 'Maintenance et réparation des systèmes de climatisation',
          categorie: 'climatisation',
          coutMoyen: 300,
          dureeMoyenne: 4
        },
        {
          id: 2,
          nom: 'Réparation plomberie',
          description: 'Réparation des fuites et remplacement de robinetterie',
          categorie: 'plomberie',
          coutMoyen: 150,
          dureeMoyenne: 2
        },
        {
          id: 3,
          nom: 'Réparation électrique',
          description: 'Maintenance des installations électriques',
          categorie: 'electricite',
          coutMoyen: 200,
          dureeMoyenne: 3
        },
        {
          id: 4,
          nom: 'Réparation mobilier',
          description: 'Réparation et remplacement de mobilier',
          categorie: 'mobilier',
          coutMoyen: 100,
          dureeMoyenne: 1
        }
      ];

      const demoTodos: MaintenanceTodo[] = [
        {
          id: 1,
          roomId: 1,
          itemId: 1,
          titre: 'Diagnostic climatisation',
          description: 'Vérifier le système de climatisation de la chambre 101',
          status: 'en_cours',
          priorite: 'haute',
          dateCreation: '2024-01-15',
          dateEcheance: '2024-01-18',
          responsable: 'Jean Dupont',
          notes: 'Système en panne, température non régulée'
        },
        {
          id: 2,
          roomId: 2,
          itemId: 2,
          titre: 'Remplacement robinet',
          description: 'Remplacer le robinet de la salle de bain',
          status: 'termine',
          priorite: 'moyenne',
          dateCreation: '2024-01-10',
          dateEcheance: '2024-01-15',
          responsable: 'Marie Martin',
          notes: 'Robinet remplacé avec succès'
        }
      ];

      setMaintenanceItems(demoItems);
      setTodos(demoTodos);
      setLoading(false);
    };

    if (!roomsLoading && realRooms) {
      processRealRooms();
    } else if (!selectedHotel) {
      // Si aucun établissement sélectionné, vider les données
      setMaintenanceRooms([]);
      setLoading(false);
    }
  }, [realRooms, roomsLoading, selectedHotel]); // Regénérer les données quand les chambres ou l'établissement changent

  // Filtrer les chambres en maintenance par critères
  const filteredRooms = maintenanceRooms.filter(room => {
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || room.priorite === priorityFilter;
    const matchesSearch = room.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Obtenir les tâches pour une chambre spécifique
  const getTasksForRoom = (roomId: number) => {
    return maintenanceTasks.filter(task => task.room_id === roomId);
  };

  // Obtenir le nom de l'élément de maintenance
  const getItemName = (itemId: number) => {
    const item = maintenanceItems.find(item => item.id === itemId);
    return item ? item.nom : 'Élément inconnu';
  };

  // Gestionnaires d'événements
  const handleAddRoom = () => {
    if (newRoom.numero.trim()) {
      const room: MaintenanceRoom = {
        id: Date.now(),
        numero: newRoom.numero,
        hotel: selectedHotel?.nom || 'Établissement',
        status: 'maintenance',
        dateDebut: new Date().toISOString().split('T')[0],
        description: newRoom.description,
        priorite: newRoom.priorite,
        responsable: newRoom.responsable,
        coutEstime: newRoom.coutEstime
      };
      setMaintenanceRooms([...maintenanceRooms, room]);
      setNewRoom({
        numero: '',
        description: '',
        priorite: 'moyenne',
        responsable: '',
        coutEstime: 0
      });
      setShowAddRoomModal(false);
    }
  };

  const handleAddItem = () => {
    if (newItem.nom.trim()) {
      const item: MaintenanceItem = {
        id: Date.now(),
        nom: newItem.nom,
        description: newItem.description,
        categorie: newItem.categorie,
        coutMoyen: newItem.coutMoyen,
        dureeMoyenne: newItem.dureeMoyenne
      };
      setMaintenanceItems([...maintenanceItems, item]);
      setNewItem({
        nom: '',
        description: '',
        categorie: 'autre',
        coutMoyen: 0,
        dureeMoyenne: 1
      });
      setShowAddItemModal(false);
    }
  };

  const handleAddTodo = async () => {
    if (newTodo.titre.trim() && selectedRoom) {
      try {
        const taskData = {
          titre: newTodo.titre,
          description: newTodo.description || null,
          priorite: newTodo.priorite as 'faible' | 'moyenne' | 'haute' | 'urgente',
          responsable: newTodo.responsable || null,
          date_echeance: newTodo.dateEcheance || null,
          notes: newTodo.notes || null,
          room_id: selectedRoom.id
        };
        
        const result = await createTask(taskData);
        
        if (result.success) {
          addNotification('success', 'Tâche ajoutée avec succès');
          setNewTodo({
            titre: '',
            description: '',
            priorite: 'moyenne',
            responsable: '',
            dateEcheance: '',
            notes: ''
          });
          setShowAddTodoModal(false);
        } else {
          addNotification('error', result.error || 'Erreur lors de la création de la tâche');
        }
      } catch (error) {
        console.error('Error creating task:', error);
        addNotification('error', 'Erreur lors de la création de la tâche');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'reparation': return 'bg-blue-100 text-blue-800';
      case 'commande': return 'bg-yellow-100 text-yellow-800';
      case 'termine': return 'bg-green-100 text-green-800';
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'occupee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'reparation': return <Settings className="h-4 w-4" />;
      case 'commande': return <Clock className="h-4 w-4" />;
      case 'termine': return <CheckCircle className="h-4 w-4" />;
      case 'disponible': return <CheckCircle className="h-4 w-4" />;
      case 'occupee': return <Bed className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Validation des transitions de statut
  const getValidTransitions = (currentStatus: string): ('disponible' | 'occupee' | 'maintenance')[] => {
    switch (currentStatus) {
      case 'disponible':
        return ['occupee', 'maintenance'];
      case 'occupee':
        return ['disponible', 'maintenance'];
      case 'maintenance':
        return ['disponible'];
      default:
        return ['disponible', 'occupee', 'maintenance'];
    }
  };

  const requiresConfirmation = (currentStatus: string, newStatus: string): boolean => {
    // Confirmation pour les changements sensibles
    if (currentStatus === 'occupee' && (newStatus === 'maintenance' || newStatus === 'disponible')) {
      return true;
    }
    if (currentStatus === 'maintenance' && newStatus === 'occupee') {
      return true;
    }
    return false;
  };

  // Gestionnaire de changement de statut
  const handleStatusChange = async (roomId: number, newStatus: 'disponible' | 'occupee' | 'maintenance') => {
    const room = filteredRooms.find(r => r.id === roomId);
    if (!room) return;

    // Vérifier si la transition est valide
    const validTransitions = getValidTransitions(room.status);
    if (!validTransitions.includes(newStatus)) {
      addNotification('error', `Transition de ${room.status} vers ${newStatus} non autorisée`);
      return;
    }

    try {
      setRoomUpdating(prev => ({ ...prev, [roomId]: true }));
      
      const result = await updateRoomStatus(roomId, newStatus);
      
      if (result.success) {
        const statusText = {
          'disponible': 'disponible',
          'occupee': 'occupée',
          'maintenance': 'en maintenance'
        }[newStatus];
        
        addNotification('success', `Chambre ${room.numero} marquée comme ${statusText}`);
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut');
    } finally {
      setRoomUpdating(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const handleStatusChangeWithConfirmation = (roomId: number, newStatus: 'disponible' | 'occupee' | 'maintenance') => {
    const room = filteredRooms.find(r => r.id === roomId);
    if (!room) return;

    if (requiresConfirmation(room.status, newStatus)) {
      setConfirmModal({
        isOpen: true,
        roomId,
        currentStatus: room.status,
        newStatus
      });
    } else {
      handleStatusChange(roomId, newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (confirmModal.roomId && confirmModal.newStatus) {
      handleStatusChange(confirmModal.roomId, confirmModal.newStatus as 'disponible' | 'occupee' | 'maintenance');
    }
    setConfirmModal({ isOpen: false });
  };

  // Fonctions pour la navigation
  const handleRoomClick = (room: MaintenanceRoom) => {
    // Seules les chambres en maintenance peuvent accéder à la vue détaillée avec tâches
    if (room.isMaintenanceRoom) {
      setSelectedRoomForDetail(room);
      setViewMode('detail');
    }
    // Pour les autres chambres, on ne fait rien (le dropdown sera utilisé pour changer le statut)
  };

  const handleBackToGrid = () => {
    setViewMode('grid');
    setSelectedRoomForDetail(null);
  };

  // Fonctions pour la gestion des tâches - utilise maintenant l'API
  const updateTaskStatus = async (taskId: number, newStatus: 'en_attente' | 'en_cours' | 'terminee' | 'annulee') => {
    try {
      const result = await updateTask(taskId, { statut: newStatus });
      if (result.success) {
        addNotification('success', 'Statut mis à jour');
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut');
    }
  };

  const updateTaskPriority = async (taskId: number, newPriority: 'faible' | 'moyenne' | 'haute' | 'urgente') => {
    try {
      const result = await updateTask(taskId, { priorite: newPriority });
      if (result.success) {
        addNotification('success', 'Priorité mise à jour');
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating task priority:', error);
      addNotification('error', 'Erreur lors de la mise à jour de la priorité');
    }
  };

  const deleteTaskHandler = async (taskId: number) => {
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        addNotification('success', 'Tâche supprimée');
      } else {
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('error', 'Erreur lors de la suppression de la tâche');
    }
  };

  // Calculer les statistiques
  const getStatistics = () => {
    const totalRoomsInEstablishment = realRooms?.length || 0;
    const availableRooms = realRooms?.filter(room => room.statut === 'disponible').length || 0;
    const occupiedRooms = realRooms?.filter(room => room.statut === 'occupee').length || 0;
    const maintenanceCount = maintenanceRooms.length;
    
    const criticalRooms = maintenanceRooms.filter(room => room.priorite === 'critique').length;
    const highPriorityRooms = maintenanceRooms.filter(room => room.priorite === 'haute').length;
    const mediumPriorityRooms = maintenanceRooms.filter(room => room.priorite === 'moyenne').length;
    const lowPriorityRooms = maintenanceRooms.filter(room => room.priorite === 'basse').length;
    
    const maintenanceStatus = maintenanceRooms.filter(room => room.status === 'maintenance').length;
    const repairRooms = maintenanceRooms.filter(room => room.status === 'reparation').length;
    const orderRooms = maintenanceRooms.filter(room => room.status === 'commande').length;
    const completedRooms = maintenanceRooms.filter(room => room.status === 'termine').length;
    
    const urgentRooms = maintenanceRooms.filter(room => {
      const startDate = new Date(room.dateDebut);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 7; // Plus de 7 jours
    }).length;

    // Utiliser les statistiques de l'API si disponibles, sinon calculer localement
    const apiStats = getTaskStatistics ? getTaskStatistics() : null;
    const totalTodos = apiStats?.total || maintenanceTasks.length;
    const pendingTodos = apiStats?.enAttente || maintenanceTasks.filter(task => task.statut === 'en_attente').length;
    const inProgressTodos = apiStats?.enCours || maintenanceTasks.filter(task => task.statut === 'en_cours').length;
    const completedTodos = apiStats?.terminees || maintenanceTasks.filter(task => task.statut === 'terminee').length;

    return {
      totalRoomsInEstablishment,
      availableRooms,
      occupiedRooms,
      maintenanceCount,
      criticalRooms,
      highPriorityRooms,
      mediumPriorityRooms,
      lowPriorityRooms,
      maintenanceStatus,
      repairRooms,
      orderRooms,
      completedRooms,
      urgentRooms,
      totalTodos,
      pendingTodos,
      inProgressTodos,
      completedTodos
    };
  };

  if (roomsLoading || loading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Chargement de la maintenance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête ultra-compact */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Wrench className="h-4 w-4 text-blue-600 mt-0.5" />
          <span className="text-lg font-semibold text-gray-900">Maintenance</span>
          {selectedHotel && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {selectedHotel.nom}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'detail' && (
            <Button variant="outline" onClick={handleBackToGrid} size="sm">
              <ArrowLeft className="h-3 w-3" />
            </Button>
          )}
          <Button onClick={() => setShowAddRoomModal(true)} size="sm" className="px-3 py-1.5 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
          <Button variant="outline" onClick={() => setShowAddItemModal(true)} size="sm" className="px-3 py-1.5 text-xs">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <>
          {/* Statistiques - Version optimisée */}
          <Card className="transition-all duration-300">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiques de maintenance
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatsCollapsed(!statsCollapsed)}
                  className="h-7 w-7 p-0"
                >
                  {statsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {!statsCollapsed && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Carte Critiques - Design amélioré */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <AlertCircle className="h-5 w-5 text-white opacity-90" />
                        <span className="text-2xl font-bold text-white">{getStatistics().criticalRooms}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Critiques</p>
                      {getStatistics().criticalRooms > 0 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Carte Urgentes */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <AlertTriangle className="h-5 w-5 text-white opacity-90" />
                        <span className="text-2xl font-bold text-white">{getStatistics().urgentRooms}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Urgentes</p>
                      {getStatistics().urgentRooms > 2 && (
                        <div className="absolute -top-1 -right-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carte Haute priorité */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <TrendingUp className="h-5 w-5 text-white opacity-90" />
                        <span className="text-2xl font-bold text-white">{getStatistics().highPriorityRooms}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Haute priorité</p>
                    </div>
                  </div>

                  {/* Carte En maintenance */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <Wrench className="h-5 w-5 text-white opacity-90" />
                        <span className="text-2xl font-bold text-white">{getStatistics().maintenanceCount}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Maintenance</p>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-20">
                        <div className="h-full bg-white opacity-60 animate-pulse" style={{width: `${(getStatistics().maintenanceCount / (getStatistics().totalRoomsInEstablishment || 1)) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Carte En réparation */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <Settings className="h-5 w-5 text-white opacity-90 group-hover:animate-spin" />
                        <span className="text-2xl font-bold text-white">{getStatistics().repairRooms}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Réparation</p>
                    </div>
                  </div>

                  {/* Carte Tâches en cours */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="absolute inset-0 bg-white opacity-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <Activity className="h-5 w-5 text-white opacity-90" />
                        <span className="text-2xl font-bold text-white">{getStatistics().inProgressTodos}</span>
                      </div>
                      <p className="text-xs text-white opacity-90 font-medium">Tâches actives</p>
                      {getStatistics().inProgressTodos > 0 && (
                        <div className="absolute top-1 right-1">
                          <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barre de progression globale */}
                <div className="mt-4 bg-gray-100 rounded-lg p-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progression globale</span>
                    <span className="font-medium">{Math.round((getStatistics().completedRooms / (getStatistics().totalRoomsInEstablishment || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                      style={{width: `${(getStatistics().completedRooms / (getStatistics().totalRoomsInEstablishment || 1)) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Filtres - Version optimisée */}
          <Card className="transition-all duration-300">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                  className="h-7 w-7 p-0"
                >
                  {filtersCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {!filtersCollapsed && (
              <CardContent className="pt-0 pb-3 px-4">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Recherche */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Statut */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="reparation">En réparation</option>
                    <option value="commande">Commande en cours</option>
                    <option value="termine">Terminé</option>
                    <option value="disponible">Disponible</option>
                    <option value="occupee">Occupée</option>
                  </select>
                  
                  {/* Priorité */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="critique">Critique</option>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="basse">Basse</option>
                  </select>
                  
                  {/* Réinitialiser */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setSearchTerm('');
                    }}
                    className="px-3 py-1.5 h-auto text-sm"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Grille des chambres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Toutes les chambres ({filteredRooms.length})
                  {selectedHotel && (
                    <span className="ml-2 text-sm text-blue-600">
                      ({selectedHotel.nom})
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRooms.map((room) => (
                    <div 
                      key={room.id} 
                      className={`border rounded-lg p-4 transition-all duration-200 group relative ${
                        room.isMaintenanceRoom 
                          ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer hover:shadow-md' 
                          : room.status === 'disponible'
                          ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer hover:shadow-sm'
                          : 'border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-default'
                      } ${roomUpdating[room.id] ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => handleRoomClick(room)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">Chambre {room.numero}</h3>
                          {room.isMaintenanceRoom && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(room.status)}>
                            {getStatusIcon(room.status)}
                            <span className="ml-1">
                              {room.status === 'maintenance' ? 'Maintenance' :
                               room.status === 'disponible' ? 'Disponible' :
                               room.status === 'occupee' ? 'Occupée' :
                               room.status}
                            </span>
                          </Badge>
                          {room.isMaintenanceRoom && room.priorite && (
                            <Badge variant="outline" className={getPriorityColor(room.priorite)}>
                              {room.priorite}
                            </Badge>
                          )}
                          
                          {/* Dropdown pour changer le statut */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                                disabled={roomUpdating[room.id]}
                              >
                                {roomUpdating[room.id] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3 w-3" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {getValidTransitions(room.status).map((status) => {
                                const statusInfo = {
                                  'disponible': { label: 'Disponible', icon: CheckCircle, color: 'text-green-600' },
                                  'occupee': { label: 'Occupée', icon: Bed, color: 'text-blue-600' },
                                  'maintenance': { label: 'Maintenance', icon: Wrench, color: 'text-orange-600' }
                                }[status];
                                
                                const Icon = statusInfo.icon;
                                
                                return (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => handleStatusChangeWithConfirmation(room.id, status)}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Icon className={`h-4 w-4 ${statusInfo.color}`} />
                                    {statusInfo.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{room.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {room.isMaintenanceRoom ? (
                          // Informations détaillées pour les chambres en maintenance
                          <>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Début: {new Date(room.dateDebut).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {room.responsable && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                <span>{room.responsable}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>Tâches:</span>
                              <span className="font-medium">{getTasksForRoom(room.id).length}</span>
                            </div>
                            {room.coutEstime && room.coutEstime > 0 && (
                              <div className="flex items-center justify-between">
                                <span>Coût estimé:</span>
                                <span className="font-medium text-orange-600">{room.coutEstime}€</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // Informations basiques pour les chambres disponibles/occupées
                          <div className="text-center py-2">
                            <div className="text-sm text-gray-600 mb-1">
                              {room.status === 'disponible' ? 'Chambre prête pour réservation' : 'Chambre actuellement occupée'}
                            </div>
                            {!room.isMaintenanceRoom && (
                              <div className="text-xs text-gray-400">
                                {room.status === 'disponible' ? 'Cliquer pour voir les détails' : 'Informations limitées'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune chambre trouvée</h3>
                  <p className="text-gray-500">
                    {selectedHotel 
                      ? `Aucune chambre trouvée pour ${selectedHotel.nom} avec les critères actuels.`
                      : 'Sélectionnez un établissement dans les paramètres pour voir les chambres.'
                    }
                    {roomsError && (
                      <span className="block mt-2 text-red-600">
                        Erreur lors du chargement des chambres.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Vue détaillée avec To-Do list
        selectedRoomForDetail && (
          <div className="space-y-6">
            {/* Informations de la chambre */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 mr-2" />
                    Chambre {selectedRoomForDetail.numero}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedRoomForDetail.status)}>
                      {getStatusIcon(selectedRoomForDetail.status)}
                      <span className="ml-1">{selectedRoomForDetail.status}</span>
                    </Badge>
                    <Badge className={getPriorityColor(selectedRoomForDetail.priorite)}>
                      {selectedRoomForDetail.priorite}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedRoomForDetail.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Début:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedRoomForDetail.dateDebut).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {selectedRoomForDetail.dateFin && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Fin:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedRoomForDetail.dateFin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedRoomForDetail.responsable && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Responsable:</span>
                        <span className="text-sm font-medium">{selectedRoomForDetail.responsable}</span>
                      </div>
                    )}
                    {selectedRoomForDetail.coutEstime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Coût estimé:</span>
                        <span className="text-sm font-medium">€{selectedRoomForDetail.coutEstime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Liste des tâches
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedRoom(selectedRoomForDetail);
                      setShowAddTodoModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une tâche
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTasksForRoom(selectedRoomForDetail.id).length > 0 ? (
                    getTasksForRoom(selectedRoomForDetail.id).map((task, index) => (
                      <div key={todo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveTodo(todo.id, 'up')}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveTodo(todo.id, 'down')}
                                  disabled={index === getTodosForRoom(selectedRoomForDetail.id).length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <h4 className="font-medium text-gray-900">{todo.titre}</h4>
                              <Badge className={getPriorityColor(todo.priorite)}>
                                {todo.priorite}
                              </Badge>
                              <Badge variant="outline" className={
                                todo.status === 'termine' ? 'bg-green-100 text-green-800' :
                                todo.status === 'en_cours' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }>
                                {todo.status === 'termine' ? 'Terminé' :
                                 todo.status === 'en_cours' ? 'En cours' : 'À faire'}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3">{todo.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {todo.responsable && (
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {todo.responsable}
                                </span>
                              )}
                              {todo.dateEcheance && (
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Échéance: {new Date(todo.dateEcheance).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                            
                            {todo.notes && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                <span className="font-medium">Notes:</span> {todo.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <select
                              value={todo.status}
                              onChange={(e) => updateTodoStatus(todo.id, e.target.value as any)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="a_faire">À faire</option>
                              <option value="en_cours">En cours</option>
                              <option value="termine">Terminé</option>
                            </select>
                            <select
                              value={todo.priorite}
                              onChange={(e) => updateTodoPriority(todo.id, e.target.value as any)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="basse">Basse</option>
                              <option value="moyenne">Moyenne</option>
                              <option value="haute">Haute</option>
                              <option value="critique">Critique</option>
                            </select>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
                      <p className="text-gray-500 mb-4">
                        Aucune tâche n'a été créée pour cette chambre.
                      </p>
                      <Button 
                        onClick={() => {
                          setSelectedRoom(selectedRoomForDetail);
                          setShowAddTodoModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer la première tâche
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Modal de confirmation de changement de statut */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmer le changement de statut</h3>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Voulez-vous vraiment changer le statut de la chambre de
                <span className="font-medium mx-1">
                  {confirmModal.currentStatus === 'maintenance' ? 'maintenance' :
                   confirmModal.currentStatus === 'disponible' ? 'disponible' :
                   confirmModal.currentStatus === 'occupee' ? 'occupée' : confirmModal.currentStatus}
                </span>
                vers
                <span className="font-medium mx-1">
                  {confirmModal.newStatus === 'maintenance' ? 'maintenance' :
                   confirmModal.newStatus === 'disponible' ? 'disponible' :
                   confirmModal.newStatus === 'occupee' ? 'occupée' : confirmModal.newStatus}
                </span>?
              </p>
              
              {confirmModal.currentStatus === 'occupee' && confirmModal.newStatus === 'maintenance' && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    ⚠️ Cette chambre est actuellement occupée. Assurez-vous que le client a été relocalisé.
                  </p>
                </div>
              )}
              
              {confirmModal.currentStatus === 'occupee' && confirmModal.newStatus === 'disponible' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ℹ️ Assurez-vous que le client a bien quitté la chambre et que le nettoyage est terminé.
                  </p>
                </div>
              )}
              
              {confirmModal.currentStatus === 'maintenance' && confirmModal.newStatus === 'occupee' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ℹ️ Assurez-vous que la maintenance est terminée avant de marquer cette chambre comme occupée.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setConfirmModal({ isOpen: false })}
              >
                Annuler
              </Button>
              <Button onClick={confirmStatusChange}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter une chambre */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter une chambre en maintenance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de chambre *</label>
                <input
                  type="text"
                  value={newRoom.numero}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, numero: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 101"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description du problème..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  value={newRoom.priorite}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, priorite: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  value={newRoom.responsable}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, responsable: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du responsable"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coût estimé (€)</label>
                <input
                  type="number"
                  value={newRoom.coutEstime}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, coutEstime: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddRoomModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddRoom} disabled={!newRoom.numero.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter un élément de maintenance */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter un élément de maintenance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={newItem.nom}
                  onChange={(e) => setNewItem(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Réparation climatisation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description de l'élément..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={newItem.categorie}
                  onChange={(e) => setNewItem(prev => ({ ...prev, categorie: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="plomberie">Plomberie</option>
                  <option value="electricite">Électricité</option>
                  <option value="mobilier">Mobilier</option>
                  <option value="climatisation">Climatisation</option>
                  <option value="securite">Sécurité</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût moyen (€)</label>
                  <input
                    type="number"
                    value={newItem.coutMoyen}
                    onChange={(e) => setNewItem(prev => ({ ...prev, coutMoyen: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée moyenne (h)</label>
                  <input
                    type="number"
                    value={newItem.dureeMoyenne}
                    onChange={(e) => setNewItem(prev => ({ ...prev, dureeMoyenne: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddItem} disabled={!newItem.nom.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter un To Do */}
      {showAddTodoModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter une tâche pour la chambre {selectedRoom.numero}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={newTodo.titre}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, titre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Diagnostiquer le problème"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description de la tâche..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  value={newTodo.priorite}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, priorite: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="faible">Faible</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  value={newTodo.responsable}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, responsable: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du responsable"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input
                  type="date"
                  value={newTodo.dateEcheance}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dateEcheance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newTodo.notes}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddTodoModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddTodo} disabled={!newTodo.titre.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
