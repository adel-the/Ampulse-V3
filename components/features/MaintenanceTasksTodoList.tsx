"use client";

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TaskStatusBadge } from '../ui/task-status-badge';
import { TaskPriorityBadge } from '../ui/task-priority-badge';
import { Tooltip } from '../ui/tooltip';
import { useMaintenanceTasks } from '@/hooks/useSupabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Trash2,
  Loader2,
  Plus,
  X,
  Edit3,
  ChevronDown,
  ChevronRight,
  User,
  CalendarX,
  Zap
} from 'lucide-react';
import { MaintenanceTask } from '@/lib/supabase';

interface MaintenanceTasksTodoListProps {
  roomId?: number;
  hotelId?: number;
  showAddButton?: boolean;
  onAddTask?: () => void;
  onEditTask?: (task: MaintenanceTask) => void;
  className?: string;
}

type TaskStatus = 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
type TaskPriority = 'faible' | 'moyenne' | 'haute' | 'urgente';

export default function MaintenanceTasksTodoList({
  roomId,
  hotelId,
  showAddButton = true,
  onAddTask,
  onEditTask,
  className = ""
}: MaintenanceTasksTodoListProps) {
  console.log('🏨 MaintenanceTasksTodoList props received:', {
    roomId,
    hotelId,
    showAddButton,
    hasOnAddTask: !!onAddTask,
    hasOnEditTask: !!onEditTask,
    className
  });
  
  const { tasks, loading, error, updateTask, deleteTask } = useMaintenanceTasks(hotelId, roomId);
  console.log('🏨 MaintenanceTasksTodoList state from hook:', {
    tasksCount: tasks.length,
    loading,
    error,
    tasks: tasks.map(t => ({ id: t.id, titre: t.titre, statut: t.statut }))
  });
  
  const { addNotification } = useNotifications();
  
  const [updatingTasks, setUpdatingTasks] = useState<Record<number, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Helper to determine if due date is approaching (within 2 days)
  const isDueSoon = (task: MaintenanceTask) => {
    if (!task.date_echeance || task.statut === 'terminee') return false;
    const dueDate = new Date(task.date_echeance);
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    return dueDate <= twoDaysFromNow && dueDate >= today;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') {
      return task.statut === 'en_attente' || task.statut === 'en_cours';
    } else if (filter === 'completed') {
      return task.statut === 'terminee';
    }
    return task.statut !== 'annulee'; // Show all except cancelled for 'all' filter
  });
  
  console.log('🏨 Tasks filtering applied:', {
    currentFilter: filter,
    totalTasks: tasks.length,
    filteredTasksCount: filteredTasks.length,
    filterBreakdown: {
      active: tasks.filter(t => t.statut === 'en_attente' || t.statut === 'en_cours').length,
      completed: tasks.filter(t => t.statut === 'terminee').length,
      cancelled: tasks.filter(t => t.statut === 'annulee').length
    }
  });

  // Sort tasks: incomplete first (by priority), then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.statut === 'terminee' && b.statut !== 'terminee') return 1;
    if (a.statut !== 'terminee' && b.statut === 'terminee') return -1;
    
    // Sort by priority for incomplete tasks
    const priorityOrder = { 'urgente': 0, 'haute': 1, 'moyenne': 2, 'faible': 3 };
    if (a.statut !== 'terminee' && b.statut !== 'terminee') {
      return priorityOrder[a.priorite] - priorityOrder[b.priorite];
    }
    
    // Sort by date for completed tasks
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Toggle task completion
  const toggleTaskCompletion = async (task: MaintenanceTask) => {
    const newStatus: TaskStatus = task.statut === 'terminee' ? 'en_attente' : 'terminee';
    
    setUpdatingTasks(prev => ({ ...prev, [task.id]: true }));
    
    try {
      const updateData: any = { statut: newStatus };
      
      if (newStatus === 'terminee') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
      
      const result = await updateTask(task.id, updateData);
      
      if (result.success) {
        addNotification('success', 
          newStatus === 'terminee' 
            ? 'Tâche marquée comme terminée' 
            : 'Tâche réouverte'
        );
      } else {
        addNotification('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      addNotification('error', 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingTasks(prev => ({ ...prev, [task.id]: false }));
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    setUpdatingTasks(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const result = await deleteTask(taskId);
      
      if (result.success) {
        addNotification('success', 'Tâche supprimée');
      } else {
        addNotification('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('error', 'Erreur lors de la suppression');
    } finally {
      setUpdatingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Toggle task expansion
  const toggleExpanded = (taskId: number) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Is task overdue
  const isOverdue = (task: MaintenanceTask) => {
    if (!task.date_echeance || task.statut === 'terminee') return false;
    return new Date(task.date_echeance) < new Date();
  };

  // Count statistics
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.statut === 'en_attente' || t.statut === 'en_cours').length,
    completed: tasks.filter(t => t.statut === 'terminee').length,
    urgent: tasks.filter(t => t.priorite === 'urgente' && t.statut !== 'terminee').length
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
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
            Tâches de maintenance ({stats.total})
          </CardTitle>
          
          {showAddButton && onAddTask && (
            <Button onClick={onAddTask} size="sm" className="px-3 py-1.5">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>

        {/* Statistics */}
        {stats.total > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center">
              <Circle className="h-4 w-4 mr-1 text-blue-500" />
              {stats.active} active{stats.active !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
              {stats.completed} terminée{stats.completed !== 1 ? 's' : ''}
            </span>
            {stats.urgent > 0 && (
              <span className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                {stats.urgent} urgente{stats.urgent !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => {
              console.log('🏨 Filter changed to: all');
              setFilter('all');
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => {
              console.log('🏨 Filter changed to: active');
              setFilter('active');
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => {
              console.log('🏨 Filter changed to: completed');
              setFilter('completed');
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filter === 'completed' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Terminées
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative mb-6">
              {tasks.length === 0 ? (
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
                    <CheckCircle2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-12 animate-bounce">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-1 -left-8 animate-bounce delay-300">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
                  {filter === 'active' ? (
                    <Clock className="h-8 w-8 text-gray-600" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {tasks.length === 0 
                ? 'Aucune tâche de maintenance' 
                : filter === 'active'
                  ? 'Aucune tâche active'
                  : filter === 'completed'
                    ? 'Aucune tâche terminée'
                    : 'Aucune tâche dans cette catégorie'
              }
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              {tasks.length === 0 
                ? "Commencez par créer votre première tâche de maintenance pour organiser et suivre vos interventions."
                : filter === 'active' 
                  ? 'Toutes vos tâches sont terminées ! Excellent travail.'
                  : filter === 'completed'
                    ? 'Aucune tâche terminée pour le moment.'
                    : 'Changez de filtre pour voir vos autres tâches.'
              }
            </p>
            
            {showAddButton && onAddTask && tasks.length === 0 && (
              <Button 
                onClick={onAddTask}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer la première tâche
              </Button>
            )}
            
            {tasks.length > 0 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  Voir toutes les tâches
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilter('active')}
                  className="hover:bg-amber-50 hover:border-amber-300"
                >
                  Tâches actives
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task) => {
              const completed = task.statut === 'terminee';
              const overdue = isOverdue(task);
              const dueSoon = isDueSoon(task);
              const isExpanded = expandedTasks[task.id];
              const isUpdating = updatingTasks[task.id];

              return (
                <div
                  key={task.id}
                  className={`group border rounded-xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md relative ${
                    completed 
                      ? 'bg-gray-50/50 border-gray-200 hover:bg-gray-100/50' 
                      : overdue
                        ? 'bg-red-50/50 border-red-300 shadow-red-100/50 shadow-md'
                        : dueSoon
                          ? 'bg-amber-50/50 border-amber-300 shadow-amber-100/50 shadow-md'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
                  } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <div className="flex items-start p-4">
                    {/* Priority Indicator */}
                    {task.priorite === 'urgente' && !completed && (
                      <div className="absolute -top-1 -right-1">
                        <Tooltip content="Tâche urgente !">
                          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                        </Tooltip>
                      </div>
                    )}
                    
                    {/* Checkbox */}
                    <Tooltip content={completed ? "Marquer comme non terminée" : "Marquer comme terminée"}>
                      <button
                        onClick={() => toggleTaskCompletion(task)}
                        disabled={isUpdating}
                        className={`mt-1 mr-4 flex-shrink-0 transition-all duration-200 transform hover:scale-110 ${
                          completed 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and badges */}
                          <div className="flex items-center gap-2 mb-2">
                            {(task.description || task.notes) && (
                              <Tooltip content={isExpanded ? "Réduire" : "Développer"}>
                                <button
                                  onClick={() => toggleExpanded(task.id)}
                                  className="p-1 hover:bg-gray-200 rounded-full transition-all duration-200 transform hover:scale-110"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </button>
                              </Tooltip>
                            )}
                            <h3 className={`font-semibold text-base flex-1 ${
                              completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {task.titre}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap sm:gap-2">
                              <TaskPriorityBadge priority={task.priorite} showIcon={false} className="text-xs sm:text-sm" />
                              <TaskStatusBadge status={task.statut} showIcon={false} className="text-xs sm:text-sm" />
                              {overdue && !completed && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse text-xs">
                                  <CalendarX className="h-3 w-3 mr-1 hidden sm:inline" />
                                  <span className="sm:hidden">!</span>
                                  <span className="hidden sm:inline">En retard</span>
                                </Badge>
                              )}
                              {dueSoon && !completed && !overdue && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                  <Zap className="h-3 w-3 mr-1 hidden sm:inline" />
                                  <span className="sm:hidden">⚡</span>
                                  <span className="hidden sm:inline">Bientôt dû</span>
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Meta information */}
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-1 flex-wrap">
                            {task.responsable && (
                              <Tooltip content="Responsable de la tâche">
                                <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                                  <User className="h-3 w-3 mr-1 text-gray-500" />
                                  <span className="font-medium text-xs sm:text-sm">{task.responsable}</span>
                                </div>
                              </Tooltip>
                            )}
                            {task.date_echeance && (
                              <Tooltip content={`Échéance: ${new Date(task.date_echeance).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}`}>
                                <div className={`flex items-center px-2 py-1 rounded-full transition-colors ${
                                  overdue && !completed 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : dueSoon && !completed
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-gray-100'
                                }`}>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span className="font-medium text-xs sm:text-sm">
                                    {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </Tooltip>
                            )}
                            {completed && task.completed_at && (
                              <Tooltip content="Date de completion">
                                <div className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  <span className="font-medium text-xs sm:text-sm">
                                    {new Date(task.completed_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </Tooltip>
                            )}
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {task.description && (
                                <p className="text-sm text-gray-600 pl-6">
                                  {task.description}
                                </p>
                              )}
                              {task.notes && (
                                <div className="pl-6 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                                  <strong>Notes:</strong> {task.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-3 opacity-0 group-hover:opacity-100 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                          {onEditTask && !completed && (
                            <Tooltip content="Modifier la tâche">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditTask(task)}
                                disabled={isUpdating}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 transform hover:scale-110"
                              >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content="Supprimer la tâche">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={isUpdating}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-all duration-200 transform hover:scale-110"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {sortedTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-500 text-center">
            {stats.completed} sur {stats.total} tâche{stats.total !== 1 ? 's' : ''} terminée{stats.completed !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}