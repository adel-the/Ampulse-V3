"use client";

import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MaintenanceTaskWithRelations } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import * as maintenanceApi from '@/lib/api/maintenance';
import MaintenanceTaskFormComplete from './MaintenanceTaskFormComplete';
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
  const { user } = useAuth();
  
  // Direct component state management
  const [tasks, setTasks] = useState<MaintenanceTaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les modals et formulaires
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTaskWithRelations | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<MaintenanceTaskWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // Simple fetch function - preserves optimistic tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await maintenanceApi.getMaintenanceTasks(hotelId, roomId);
      if (result.success) {
        // Preserve optimistic tasks when fetching new data
        setTasks(prevTasks => {
          const optimisticTasks = prevTasks.filter(task => task._isOptimistic);
          const newTasks = [...optimisticTasks, ...result.data];
          console.log('🔄 FetchTasks - Preserved optimistic tasks:', {
            optimisticCount: optimisticTasks.length,
            newFromServer: result.data.length,
            total: newTasks.length
          });
          return newTasks;
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  }, [hotelId, roomId]);

  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Optional: Simple periodic refresh when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !showCreateForm && !editingTask) {
        fetchTasks();
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [fetchTasks, showCreateForm, editingTask]);

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.statut === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priorite === priorityFilter;
    const matchesSearch = task.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Log pour déboguer le filtrage des nouvelles tâches
    if (task._isOptimistic) {
      console.log('🔍 Filtrage tâche optimiste:', {
        titre: task.titre,
        statut: task.statut,
        priorite: task.priorite,
        statusFilter,
        priorityFilter,
        searchTerm,
        matchesStatus,
        matchesPriority,
        matchesSearch,
        visible: matchesStatus && matchesPriority && matchesSearch
      });
    }
    
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

  // Optimistic quick actions with instant feedback
  const handleQuickAction = async (taskId: number, action: 'complete' | 'start' | 'cancel') => {
    const statusMap = {
      complete: 'terminee',
      start: 'en_cours', 
      cancel: 'annulee'
    };
    
    const newStatus = statusMap[action];
    const originalTasks = tasks;
    
    // 1. Update state immediately - INSTANT FEEDBACK
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, statut: newStatus as any, updated_at: new Date().toISOString() }
        : task
    ));
    
    setActionLoading(prev => ({ ...prev, [taskId]: true }));

    try {
      // 2. Call API
      const result = await maintenanceApi.updateMaintenanceTask(taskId, { statut: newStatus }, user?.id);

      if (result.success) {
        // 3. Update with server data
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.data! : task
        ));
        
        const actionText = action === 'complete' ? 'terminée' : action === 'start' ? 'démarrée' : 'annulée';
        addNotification('success', `Tâche ${actionText} avec succès`);
      } else {
        // 4. Revert on error
        setTasks(originalTasks);
        addNotification('error', result.error || `Erreur lors de l'action sur la tâche`);
      }
    } catch (error) {
      // 5. Revert on network error
      setTasks(originalTasks);
      console.error('Error performing quick action:', error);
      addNotification('error', 'Erreur inattendue lors de l\'action');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Optimistic delete with immediate removal
  const handleDelete = async () => {
    if (!taskToDelete) return;

    const originalTasks = tasks;
    const taskId = taskToDelete.id;
    
    // 1. Remove immediately - INSTANT FEEDBACK
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setTaskToDelete(null);
    setActionLoading(prev => ({ ...prev, [taskId]: true }));

    try {
      // 2. Call API
      const result = await maintenanceApi.deleteMaintenanceTask(taskId, user?.id);

      if (result.success) {
        addNotification('success', 'Tâche supprimée avec succès');
      } else {
        // 3. Restore on error
        setTasks(originalTasks);
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      // 4. Restore on network error
      setTasks(originalTasks);
      console.error('Error deleting task:', error);
      addNotification('error', 'Erreur inattendue lors de la suppression');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Optimistic create with instant display
  const handleCreateSubmit = async (data: any) => {
    if (!hotelId) {
      addNotification('error', 'ID d\'hôtel requis');
      return { success: false, error: 'ID d\'hôtel requis' };
    }
    
    // Reset filters FIRST to ensure new task will be visible - using flushSync for immediate update
    if (statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm !== '') {
      console.log('🔍 AVANT réinitialisation filtres:', { statusFilter, priorityFilter, searchTerm });
      flushSync(() => {
        setStatusFilter('all');
        setPriorityFilter('all');
        setSearchTerm('');
      });
      console.log('🔍 APRÈS réinitialisation filtres - forcée avec flushSync');
    }
    
    // 1. Create optimistic task immediately
    const optimisticTask: MaintenanceTaskWithRelations = {
      id: -Date.now(), // Negative ID to avoid collisions with existing tasks
      ...data,
      hotel_id: hotelId,
      room_id: data.room_id || null, // Explicitly allow null
      statut: 'en_attente' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_owner_id: user?.id || 'temp-user',
      created_by: user?.id || 'temp-user',
      completed_at: null,
      room: data.room_id ? { numero: 'Loading...', bed_type: 'simple' } : null,
      hotel: { nom: 'Loading...' },
      _isOptimistic: true as any // Flag for tracking
    };

    // 2. Add to state immediately - INSTANT DISPLAY
    console.log('🎯 Adding optimistic task to state:', {
      titre: optimisticTask.titre,
      priorite: optimisticTask.priorite,
      statut: optimisticTask.statut,
      id: optimisticTask.id
    });
    setTasks(prev => {
      const newTasks = [optimisticTask, ...prev];
      console.log('📋 Tasks update:', {
        before: prev.length,
        after: newTasks.length,
        newTaskTitle: optimisticTask.titre
      });
      return newTasks;
    });
    
    // 3. Close form after adding task
    setShowCreateForm(false);

    try {
      // 4. Call API
      console.log('🌐 Calling maintenance API with data:', data);
      const result = await maintenanceApi.createMaintenanceTask(data, hotelId, user?.id);
      console.log('📡 API response:', result);
      
      if (result.success) {
        // 5. Replace optimistic with server data
        console.log('✅ API Success - Replacing optimistic task with server data:', {
          optimisticId: optimisticTask.id,
          serverId: result.data?.id,
          serverTitle: result.data?.titre
        });
        setTasks(prev => {
          const updatedTasks = prev.map(task => 
            task.id === optimisticTask.id 
              ? { ...result.data!, _isOptimistic: undefined }
              : task
          );
          console.log('📋 Tasks after API success:', {
            before: prev.length,
            after: updatedTasks.length,
            replacedOptimistic: prev.some(t => t.id === optimisticTask.id),
            hasServerTask: updatedTasks.some(t => t.id === result.data?.id)
          });
          return updatedTasks;
        });
        
        addNotification('success', 'Tâche créée avec succès');
        return { success: true };
      } else {
        // 6. On error, remove optimistic task and show error
        console.log('❌ API Error - Removing optimistic task:', result.error);
        setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
        setError(result.error);
        addNotification('error', result.error || 'Erreur lors de la création');
        return { success: false, error: result.error };
      }
    } catch (err) {
      // 7. On network error, mark task as failed but keep it
      console.log('🔥 Network Error - Marking task as failed:', err);
      setTasks(prev => prev.map(task => 
        task.id === optimisticTask.id 
          ? { ...task, _hasError: true as any }
          : task
      ));
      
      const errorMsg = 'Erreur réseau - tâche sauvegardée localement';
      setError(errorMsg);
      addNotification('error', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Optimistic edit with instant update
  const handleEditSubmit = async (data: any) => {
    if (!editingTask) return { success: false, error: 'Aucune tâche à modifier' };

    const originalTasks = tasks;
    const taskId = editingTask.id;
    
    // 1. Update state immediately - INSTANT FEEDBACK
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...data, updated_at: new Date().toISOString() }
        : task
    ));
    
    setEditingTask(null);
    
    // Reset filters if needed to keep updated task visible
    const updatedTask = { ...editingTask, ...data };
    const matchesStatus = statusFilter === 'all' || updatedTask.statut === statusFilter;
    const matchesPriority = priorityFilter === 'all' || updatedTask.priorite === priorityFilter;
    
    if (!matchesStatus || !matchesPriority) {
      setStatusFilter('all');
      setPriorityFilter('all');
      setSearchTerm('');
    }

    try {
      // 2. Call API
      const result = await maintenanceApi.updateMaintenanceTask(taskId, data, user?.id);
      
      if (result.success) {
        // 3. Update with server data
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.data! : task
        ));
        
        addNotification('success', 'Tâche modifiée avec succès');
        return { success: true };
      } else {
        // 4. Revert on error
        setTasks(originalTasks);
        addNotification('error', result.error || 'Erreur lors de la modification');
        return { success: false, error: result.error };
      }
    } catch (err) {
      // 5. Revert on network error
      setTasks(originalTasks);
      const errorMsg = 'Erreur lors de la modification';
      addNotification('error', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Debug: vérifier les tâches filtrées
  console.log('📊 Rendu - Statistiques des tâches:', {
    totalTasks: tasks.length,
    filteredTasks: filteredTasks.length,
    optimisticTasks: tasks.filter(t => t._isOptimistic).length,
    filteredOptimisticTasks: filteredTasks.filter(t => t._isOptimistic).length,
    currentFilters: { statusFilter, priorityFilter, searchTerm }
  });

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