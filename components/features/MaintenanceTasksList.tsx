"use client";

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useMaintenanceTasks } from '@/hooks/useSupabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Edit3,
  Trash2,
  MoreHorizontal,
  Loader2,
  ArrowUpDown,
  Filter,
  Search,
  Plus,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MaintenanceTask } from '@/lib/supabase';

interface MaintenanceTasksListProps {
  roomId?: number;
  hotelId?: number;
  showAddButton?: boolean;
  onAddTask?: () => void;
  onEditTask?: (task: MaintenanceTask) => void;
  className?: string;
}

type TaskStatus = 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
type TaskPriority = 'faible' | 'moyenne' | 'haute' | 'urgente';
type SortField = 'created_at' | 'date_echeance' | 'priorite' | 'titre';
type SortOrder = 'asc' | 'desc';

export default function MaintenanceTasksList({
  roomId,
  hotelId,
  showAddButton = true,
  onAddTask,
  onEditTask,
  className = ""
}: MaintenanceTasksListProps) {
  const { tasks, loading, error, updateTask, deleteTask } = useMaintenanceTasks(hotelId, roomId);
  const { addNotification } = useNotifications();
  
  const [updatingTasks, setUpdatingTasks] = useState<Record<number, boolean>>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get status display info
  const getStatusInfo = (status: TaskStatus) => {
    switch (status) {
      case 'en_attente':
        return {
          label: 'En attente',
          color: 'bg-gray-100 text-gray-800',
          icon: Clock
        };
      case 'en_cours':
        return {
          label: 'En cours',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock
        };
      case 'terminee':
        return {
          label: 'Terminée',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle2
        };
      case 'annulee':
        return {
          label: 'Annulée',
          color: 'bg-red-100 text-red-800',
          icon: AlertTriangle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: Clock
        };
    }
  };

  // Get priority display info
  const getPriorityInfo = (priority: TaskPriority) => {
    switch (priority) {
      case 'faible':
        return {
          label: 'Faible',
          color: 'bg-green-100 text-green-800'
        };
      case 'moyenne':
        return {
          label: 'Moyenne',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'haute':
        return {
          label: 'Haute',
          color: 'bg-orange-100 text-orange-800'
        };
      case 'urgente':
        return {
          label: 'Urgente',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: priority,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Status filter
      if (statusFilter !== 'all' && task.statut !== statusFilter) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== 'all' && task.priorite !== priorityFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          task.titre.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.responsable?.toLowerCase().includes(searchLower) ||
          task.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'date_echeance':
          aValue = a.date_echeance ? new Date(a.date_echeance) : new Date('9999-12-31');
          bValue = b.date_echeance ? new Date(b.date_echeance) : new Date('9999-12-31');
          break;
        case 'priorite':
          const priorityOrder = { 'urgente': 4, 'haute': 3, 'moyenne': 2, 'faible': 1 };
          aValue = priorityOrder[a.priorite];
          bValue = priorityOrder[b.priorite];
          break;
        case 'titre':
          aValue = a.titre.toLowerCase();
          bValue = b.titre.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Handle status update
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setUpdatingTasks(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const updateData: any = { statut: newStatus };
      
      // Set completed_at when task is marked as completed
      if (newStatus === 'terminee') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        addNotification('success', `Tâche marquée comme ${getStatusInfo(newStatus).label.toLowerCase()}`);
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Handle priority update
  const handlePriorityChange = async (taskId: number, newPriority: TaskPriority) => {
    setUpdatingTasks(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const result = await updateTask(taskId, { priorite: newPriority });
      
      if (result.success) {
        addNotification('success', `Priorité mise à jour vers ${getPriorityInfo(newPriority).label}`);
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating task priority:', error);
      addNotification('error', 'Erreur lors de la mise à jour de la priorité');
    } finally {
      setUpdatingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }
    
    setUpdatingTasks(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const result = await deleteTask(taskId);
      
      if (result.success) {
        addNotification('success', 'Tâche supprimée avec succès');
      } else {
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('error', 'Erreur lors de la suppression de la tâche');
    } finally {
      setUpdatingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Is overdue check
  const isOverdue = (task: MaintenanceTask) => {
    if (!task.date_echeance || task.statut === 'terminee') return false;
    return new Date(task.date_echeance) < new Date();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-600">Chargement des tâches...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
          <span className="text-red-600">Erreur: {error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
            Tâches de maintenance ({filteredTasks.length})
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtres
            </Button>
            
            {showAddButton && onAddTask && (
              <Button
                onClick={onAddTask}
                size="sm"
                className="px-3 py-1.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les tâches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
              
              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Toutes les priorités</option>
                <option value="urgente">Urgente</option>
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="faible">Faible</option>
              </select>
              
              {/* Reset */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setSearchTerm('');
                }}
                className="px-3 py-2 h-auto text-sm"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tasks.length === 0 ? 'Aucune tâche' : 'Aucune tâche trouvée'}
            </h3>
            <p className="text-gray-500 mb-4">
              {tasks.length === 0 
                ? 'Aucune tâche de maintenance n\'a été créée.'
                : 'Aucune tâche ne correspond aux critères de recherche.'
              }
            </p>
            {showAddButton && onAddTask && tasks.length === 0 && (
              <Button onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première tâche
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sort controls */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 border-b border-gray-200 pb-2">
              <span>Trier par:</span>
              <button
                onClick={() => handleSort('created_at')}
                className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 ${
                  sortField === 'created_at' ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Date création <ArrowUpDown className="h-3 w-3 ml-1" />
              </button>
              <button
                onClick={() => handleSort('date_echeance')}
                className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 ${
                  sortField === 'date_echeance' ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Échéance <ArrowUpDown className="h-3 w-3 ml-1" />
              </button>
              <button
                onClick={() => handleSort('priorite')}
                className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 ${
                  sortField === 'priorite' ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Priorité <ArrowUpDown className="h-3 w-3 ml-1" />
              </button>
            </div>

            {/* Tasks list */}
            {filteredTasks.map((task) => {
              const statusInfo = getStatusInfo(task.statut);
              const priorityInfo = getPriorityInfo(task.priorite);
              const StatusIcon = statusInfo.icon;
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
                    overdue && task.statut !== 'terminee' ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                  } ${updatingTasks[task.id] ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{task.titre}</h4>
                            {overdue && task.statut !== 'terminee' && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                En retard
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={`${statusInfo.color} text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={`${priorityInfo.color} text-xs`}>
                              {priorityInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {task.responsable && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {task.responsable}
                          </span>
                        )}
                        
                        {task.date_echeance && (
                          <span className={`flex items-center ${overdue ? 'text-red-600' : ''}`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Échéance: {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(task.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <FileText className="h-3 w-3 inline mr-1" />
                          <span className="font-medium">Notes:</span> {task.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions dropdown */}
                    <div className="flex items-center space-x-2 ml-4">
                      {updatingTasks[task.id] && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={updatingTasks[task.id]}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent align="end" className="w-48">
                          {/* Status changes */}
                          {task.statut !== 'en_attente' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'en_attente')}>
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              Marquer en attente
                            </DropdownMenuItem>
                          )}
                          
                          {task.statut !== 'en_cours' && task.statut !== 'terminee' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'en_cours')}>
                              <Clock className="h-4 w-4 mr-2 text-blue-500" />
                              Marquer en cours
                            </DropdownMenuItem>
                          )}
                          
                          {task.statut !== 'terminee' && task.statut !== 'annulee' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'terminee')}>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Marquer terminée
                            </DropdownMenuItem>
                          )}
                          
                          {task.statut !== 'annulee' && task.statut !== 'terminee' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'annulee')}>
                              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                          
                          {onEditTask && (
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                              <Edit3 className="h-4 w-4 mr-2 text-gray-500" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}