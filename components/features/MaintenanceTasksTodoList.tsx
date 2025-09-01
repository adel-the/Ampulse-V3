"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MaintenanceTask } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useMaintenanceTasks } from '@/hooks/useSupabase';
// 🔧 TEMPORARY FIX: Import the fixed hook for better re-rendering
// import { useMaintenanceTasksFixed as useMaintenanceTasks } from '@/hooks/useMaintenanceTasksFixed';
import MaintenanceTaskFormComplete from './MaintenanceTaskFormComplete';
import MaintenanceDebugPanel from '../debug/MaintenanceDebugPanel';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Calendar,
  User,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
  Search
} from 'lucide-react';

interface MaintenanceTasksTodoListProps {
  hotelId?: number;
  roomId?: number;
  showAddButton?: boolean;
  onAddTask?: () => void;
}

export default function MaintenanceTasksTodoList({
  hotelId,
  roomId,
  showAddButton = true,
  onAddTask
}: MaintenanceTasksTodoListProps) {
  const { addNotification } = useNotifications();
  
  // Utiliser le hook bulletproof avec toutes les stratégies de synchronisation
  const { 
    tasks, 
    loading, 
    error,
    createTask,
    updateTask,
    deleteTask,
    forceRefresh,
    isPollingActive,
    currentInterval,
    metrics,
    debugInfo
  } = useMaintenanceTasks({
    hotelId,
    roomId,
    enablePolling: true,
    basePollingInterval: 2000, // Polling agressif pour les tests
    enablePageReloadFallback: true, // Activer fallback rechargement si nécessaire
    debug: process.env.NODE_ENV === 'development'
  });

  // États pour les modals et formulaires
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<MaintenanceTask | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.statut === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priorite === priorityFilter;
    const matchesSearch = task.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Obtenir la couleur de la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200';
      case 'haute': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'faible': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'terminee': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_attente': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'annulee': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'terminee': return <Check className="h-4 w-4" />;
      case 'en_cours': return <Clock className="h-4 w-4" />;
      case 'en_attente': return <AlertCircle className="h-4 w-4" />;
      case 'annulee': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'terminee': return 'Terminée';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  // Gestionnaires d'événements pour les actions rapides (optimisées avec bulletproof)
  const handleQuickAction = async (taskId: number, action: 'complete' | 'start' | 'cancel') => {
    setActionLoading(prev => ({ ...prev, [taskId]: true }));

    try {
      let result;
      const statusMap = {
        complete: 'terminee',
        start: 'en_cours',
        cancel: 'annulee'
      };
      
      result = await updateTask(taskId, { statut: statusMap[action] });

      if (result.success) {
        const actionText = action === 'complete' ? 'terminée' : action === 'start' ? 'démarrée' : 'annulée';
        addNotification('success', `Tâche ${actionText} avec succès - Synchronisation automatique en cours`);
        
        // Le hook bulletproof gère automatiquement la synchronisation
        console.log('🔄 Action effectuée, synchronisation automatique activée');
      } else {
        addNotification('error', result.error || `Erreur lors de l'action sur la tâche`);
      }
    } catch (error) {
      console.error('Error performing quick action:', error);
      addNotification('error', 'Erreur inattendue lors de l\'action');
      
      // En cas d'erreur critique, forcer un refresh
      setTimeout(() => forceRefresh(), 1000);
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Gestionnaire de suppression avec confirmation
  const handleDelete = async () => {
    if (!taskToDelete) return;

    setActionLoading(prev => ({ ...prev, [taskToDelete.id]: true }));

    try {
      const result = await deleteTask(taskToDelete.id);

      if (result.success) {
        addNotification('success', 'Tâche supprimée avec succès');
        setTaskToDelete(null);
      } else {
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('error', 'Erreur inattendue lors de la suppression');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskToDelete.id]: false }));
    }
  };

  // Gestionnaire de création de tâche
  const handleCreateSubmit = async (data: any) => {
    console.log('🚀 [MaintenanceTasksTodoList] handleCreateSubmit DÉMARRÉ');
    console.log('🚀 Création de tâche démarrée avec data:', data);
    console.log('🔍 État actuel - tasks.length:', tasks.length);
    console.log('🔍 fetchTasks disponible:', typeof fetchTasks, fetchTasks !== undefined);
    
    const result = await createTask(data);
    console.log('🔍 Résultat createTask:', result);
    
    if (result.success) {
      console.log('✅ Tâche créée avec succès:', result.data);
      console.log('🔍 État après création - tasks.length:', tasks.length);
      
      // 🚨 SOLUTION FINALE BRUTALE : Rechargement garanti
      console.log('💥 SOLUTION RADICALE : Rechargement automatique obligatoire');
      
      setShowCreateForm(false);
      addNotification('success', 'Tâche créée avec succès ! Rechargement automatique...');
      
      // SOLUTION GARANTIE : Rechargement complet après 1.5 secondes
      console.log('⏰ Rechargement automatique programmé dans 1.5 secondes');
      setTimeout(() => {
        console.log('🔄 RECHARGEMENT FORCÉ - window.location.reload()');
        window.location.reload();
      }, 1500);
    } else {
      console.error('❌ Échec de création:', result.error);
      addNotification('error', result.error || 'Erreur lors de la création');
    }
    
    console.log('🏁 [MaintenanceTasksTodoList] handleCreateSubmit TERMINÉ');
    return result;
  };

  // Gestionnaire d'édition de tâche
  const handleEditSubmit = async (data: any) => {
    if (!editingTask) return { success: false, error: 'Aucune tâche à modifier' };

    console.log('📝 Modification de tâche démarrée pour ID:', editingTask.id);
    const result = await updateTask(editingTask.id, data);
    
    if (result.success) {
      console.log('✅ Tâche modifiée avec succès:', result.data);
      
      // S'assurer que la tâche modifiée reste visible si les filtres ont changé
      const updatedTask = result.data;
      if (updatedTask) {
        // Si la tâche modifiée ne correspond plus aux filtres actuels, les réinitialiser
        const matchesStatus = statusFilter === 'all' || updatedTask.statut === statusFilter;
        const matchesPriority = priorityFilter === 'all' || updatedTask.priorite === priorityFilter;
        
        if (!matchesStatus || !matchesPriority) {
          setStatusFilter('all');
          setPriorityFilter('all');
          setSearchTerm('');
          console.log('🔄 Filtres réinitialisés pour afficher la tâche modifiée');
        }
      }
      
      setEditingTask(null);
      addNotification('success', 'Tâche modifiée avec succès');
    } else {
      console.error('❌ Échec de modification:', result.error);
      addNotification('error', result.error || 'Erreur lors de la modification');
    }
    
    return result;
  };

  // Calculer les statistiques
  const stats = {
    total: tasks.length,
    enAttente: tasks.filter(t => t.statut === 'en_attente').length,
    enCours: tasks.filter(t => t.statut === 'en_cours').length,
    terminees: tasks.filter(t => t.statut === 'terminee').length,
    urgentes: tasks.filter(t => t.priorite === 'urgente').length
  };

  // Si on affiche le formulaire de création
  if (showCreateForm) {
    return (
      <MaintenanceTaskFormComplete
        task={null}
        onSubmit={handleCreateSubmit}
        onCancel={() => setShowCreateForm(false)}
        hotelId={hotelId}
        roomId={roomId}
        loading={loading}
      />
    );
  }

  // Si on affiche le formulaire d'édition
  if (editingTask) {
    return (
      <MaintenanceTaskFormComplete
        task={editingTask}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditingTask(null)}
        hotelId={hotelId}
        roomId={roomId}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.enAttente}</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.enCours}</div>
              <div className="text-sm text-gray-500">En cours</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.terminees}</div>
              <div className="text-sm text-gray-500">Terminées</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.urgentes}</div>
              <div className="text-sm text-gray-500">Urgentes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tâches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tâches de maintenance ({filteredTasks.length})
            </CardTitle>
            {showAddButton && (
              <Button onClick={onAddTask || (() => setShowCreateForm(true))} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            )}
          </div>
          
          {/* Filtres */}
          <div className="flex flex-wrap gap-3 items-center mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="urgente">Urgente</option>
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="faible">Faible</option>
            </select>
            
            {(statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setSearchTerm('');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Chargement des tâches...</span>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* En-tête de la tâche */}
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-gray-900">{task.titre}</h4>
                        <Badge className={getPriorityColor(task.priorite)} variant="outline">
                          {task.priorite}
                        </Badge>
                        <Badge className={getStatusColor(task.statut)} variant="outline">
                          {getStatusIcon(task.statut)}
                          <span className="ml-1">{getStatusLabel(task.statut)}</span>
                        </Badge>
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Informations supplémentaires */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                        {task.responsable && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.responsable}
                          </span>
                        )}
                        {task.date_echeance && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Échéance: {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Créé le: {new Date(task.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      {/* Notes */}
                      {task.notes && (
                        <div className="bg-gray-100 rounded p-2 text-xs">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Actions rapides selon le statut */}
                      {task.statut === 'en_attente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAction(task.id, 'start')}
                          disabled={actionLoading[task.id]}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {actionLoading[task.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      {task.statut === 'en_cours' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAction(task.id, 'complete')}
                          disabled={actionLoading[task.id]}
                          className="text-green-600 hover:text-green-700"
                        >
                          {actionLoading[task.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      {(task.statut === 'en_attente' || task.statut === 'en_cours') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAction(task.id, 'cancel')}
                          disabled={actionLoading[task.id]}
                          className="text-red-600 hover:text-red-700"
                        >
                          {actionLoading[task.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      {/* Bouton d'édition */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTask(task)}
                        disabled={actionLoading[task.id]}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      
                      {/* Bouton de suppression */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTaskToDelete(task)}
                        disabled={actionLoading[task.id]}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tasks.length === 0 ? 'Aucune tâche' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-500 mb-4">
                {tasks.length === 0 
                  ? 'Aucune tâche de maintenance n\'a été créée.'
                  : 'Aucune tâche ne correspond aux filtres sélectionnés.'}
              </p>
              {showAddButton && (
                <Button onClick={onAddTask || (() => setShowCreateForm(true))}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une tâche
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmation de suppression */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500">Cette action ne peut pas être annulée</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer la tâche <span className="font-medium">"{taskToDelete.titre}"</span> ?
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setTaskToDelete(null)}
                disabled={actionLoading[taskToDelete.id]}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={actionLoading[taskToDelete.id]}
                className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
              >
                {actionLoading[taskToDelete.id] ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}