"use client";

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useMaintenanceTasks } from '@/hooks/useSupabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Calendar,
  User,
  AlertTriangle,
  FileText,
  StickyNote,
  Save,
  X,
  Loader2
} from 'lucide-react';

interface MaintenanceTaskFormProps {
  selectedRoomId?: number;
  currentHotelId?: number;
  currentUserId?: string;
  onTaskCreated?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface TaskFormData {
  titre: string;
  description: string;
  priorite: 'faible' | 'moyenne' | 'haute' | 'urgente';
  responsable: string;
  date_echeance: string;
  notes: string;
}

export default function MaintenanceTaskForm({
  selectedRoomId,
  currentHotelId,
  currentUserId,
  onTaskCreated,
  onCancel,
  className = ""
}: MaintenanceTaskFormProps) {
  const { createTask } = useMaintenanceTasks(currentHotelId);
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState<TaskFormData>({
    titre: '',
    description: '',
    priorite: 'moyenne',
    responsable: '',
    date_echeance: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};
    
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }
    
    if (formData.titre.trim().length < 3) {
      newErrors.titre = 'Le titre doit contenir au moins 3 caractères';
    }
    
    if (formData.date_echeance) {
      const echeanceDate = new Date(formData.date_echeance);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (echeanceDate < today) {
        newErrors.date_echeance = 'La date d\'échéance ne peut pas être dans le passé';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    if (!selectedRoomId || !currentHotelId) {
      addNotification('error', 'Informations de chambre ou d\'hôtel manquantes');
      return;
    }
    
    setLoading(true);
    
    try {
      const taskData = {
        titre: formData.titre.trim(),
        description: formData.description?.trim() || null,
        priorite: formData.priorite,
        responsable: formData.responsable?.trim() || null,
        date_echeance: formData.date_echeance || null,
        notes: formData.notes?.trim() || null,
        room_id: selectedRoomId
      };
      
      const result = await createTask(taskData);
      
      if (result.success) {
        addNotification('success', 'Tâche de maintenance créée avec succès');
        
        // Reset form
        setFormData({
          titre: '',
          description: '',
          priorite: 'moyenne',
          responsable: '',
          date_echeance: '',
          notes: ''
        });
        
        onTaskCreated?.();
      } else {
        addNotification('error', result.error || 'Erreur lors de la création de la tâche');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification('error', 'Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Nouvelle tâche de maintenance
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre" className="text-sm font-medium text-gray-700">
              Titre de la tâche *
            </Label>
            <input
              id="titre"
              type="text"
              value={formData.titre}
              onChange={(e) => handleInputChange('titre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.titre ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Réparer la climatisation"
              disabled={loading}
            />
            {errors.titre && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.titre}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Décrivez la tâche en détail..."
              disabled={loading}
            />
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priorite" className="text-sm font-medium text-gray-700">
              Priorité
            </Label>
            <select
              id="priorite"
              value={formData.priorite}
              onChange={(e) => handleInputChange('priorite', e.target.value as TaskFormData['priorite'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="faible">Faible</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable" className="text-sm font-medium text-gray-700">
              Responsable
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="responsable"
                type="text"
                value={formData.responsable}
                onChange={(e) => handleInputChange('responsable', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom du responsable"
                disabled={loading}
              />
            </div>
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="date_echeance" className="text-sm font-medium text-gray-700">
              Date d'échéance
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="date_echeance"
                type="date"
                value={formData.date_echeance}
                onChange={(e) => handleInputChange('date_echeance', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_echeance ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.date_echeance && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.date_echeance}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes supplémentaires
            </Label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Notes internes, observations..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !formData.titre.trim()}
              className="px-4 py-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Enregistrement...' : 'Créer la tâche'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}