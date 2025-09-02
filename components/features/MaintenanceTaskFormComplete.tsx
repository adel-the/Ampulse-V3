"use client";

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { MaintenanceTask } from '@/lib/supabase';
import { 
  Calendar,
  User,
  AlertTriangle,
  FileText,
  StickyNote,
  Save,
  X,
  Loader2,
  Edit
} from 'lucide-react';

interface MaintenanceTaskFormProps {
  task: MaintenanceTask | null;  // null pour création, objet pour édition
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  hotelId?: number;
  roomId?: number;
  loading?: boolean;
}

export default function MaintenanceTaskFormComplete({
  task,
  onSubmit,
  onCancel,
  hotelId,
  roomId,
  loading: externalLoading = false
}: MaintenanceTaskFormProps) {
  const isEditMode = !!task;
  
  // État initial du formulaire basé sur la tâche existante ou vide
  const [formData, setFormData] = useState({
    titre: task?.titre || '',
    description: task?.description || '',
    priorite: task?.priorite || 'moyenne',
    responsable: task?.responsable || '',
    date_echeance: task?.date_echeance || '',
    notes: task?.notes || '',
    statut: task?.statut || 'en_attente'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pré-remplir le formulaire quand la tâche change (mode édition)
  useEffect(() => {
    if (task) {
      setFormData({
        titre: task.titre || '',
        description: task.description || '',
        priorite: task.priorite || 'moyenne',
        responsable: task.responsable || '',
        date_echeance: task.date_echeance || '',
        notes: task.notes || '',
        statut: task.statut || 'en_attente'
      });
    }
  }, [task]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }
    
    if (formData.titre.trim().length < 3) {
      newErrors.titre = 'Le titre doit contenir au moins 3 caractères';
    }
    
    if (!hotelId || hotelId === 0) {
      newErrors.hotel = 'L\'hôtel est requis';
    }
    
    // Room is optional - maintenance tasks can be general (not room-specific)
    // if (!roomId || roomId === 0) {
    //   newErrors.room = 'La chambre est requise';
    // }
    
    if (formData.date_echeance) {
      const echeanceDate = new Date(formData.date_echeance);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (echeanceDate < today && !isEditMode) {
        newErrors.date_echeance = 'La date d\'échéance ne peut pas être dans le passé';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.error('Validation failed:', errors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Préparer les données pour la soumission
      const submitData = {
        ...formData,
        titre: formData.titre.trim(),
        description: formData.description?.trim() || null,
        responsable: formData.responsable?.trim() || null,
        notes: formData.notes?.trim() || null,
        date_echeance: formData.date_echeance || null,
        hotel_id: hotelId,
        room_id: roomId
      };
      
      // Log pour débogage
      console.log('📝 Soumission du formulaire:', {
        mode: isEditMode ? 'édition' : 'création',
        taskId: task?.id,
        submitData,
        hotelId,
        roomId,
        timestamp: new Date().toISOString()
      });
      
      const result = await onSubmit(submitData);
      console.log('🔄 Résultat du callback onSubmit:', result);
      
      if (!result.success) {
        console.error('❌ Erreur lors de la soumission:', result.error);
        setErrors({ submit: result.error || 'Erreur lors de la soumission' });
      } else {
        console.log('✅ Formulaire soumis avec succès');
      }
      // Si succès, le parent gère la fermeture du formulaire
      
    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
      setErrors({ submit: 'Erreur inattendue lors de la soumission' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isSubmitting = loading || externalLoading;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          {isEditMode ? (
            <>
              <Edit className="h-5 w-5 mr-2 text-blue-600" />
              Modifier la tâche de maintenance
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Nouvelle tâche de maintenance
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Afficher les erreurs globales */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}
          
          {(errors.hotel || errors.room) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errors.hotel || errors.room}
            </div>
          )}
          
          {/* Informations de debug en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
              Debug: hotelId={hotelId}, roomId={roomId}, mode={isEditMode ? 'edit' : 'create'}
              {isEditMode && `, taskId=${task.id}`}
            </div>
          )}
          
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
              disabled={isSubmitting}
            />
            {errors.titre && (
              <p className="text-red-500 text-xs mt-1">{errors.titre}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Détails de la tâche..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Priorité et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priorite" className="text-sm font-medium text-gray-700">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Priorité
              </Label>
              <select
                id="priorite"
                value={formData.priorite}
                onChange={(e) => handleInputChange('priorite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="statut" className="text-sm font-medium text-gray-700">
                  Statut
                </Label>
                <select
                  id="statut"
                  value={formData.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Responsable et Date d'échéance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsable" className="text-sm font-medium text-gray-700">
                <User className="inline h-3 w-3 mr-1" />
                Responsable
              </Label>
              <input
                id="responsable"
                type="text"
                value={formData.responsable}
                onChange={(e) => handleInputChange('responsable', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom du responsable"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_echeance" className="text-sm font-medium text-gray-700">
                <Calendar className="inline h-3 w-3 mr-1" />
                Date d'échéance
              </Label>
              <input
                id="date_echeance"
                type="date"
                value={formData.date_echeance}
                onChange={(e) => handleInputChange('date_echeance', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_echeance ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.date_echeance && (
                <p className="text-red-500 text-xs mt-1">{errors.date_echeance}</p>
              )}
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              <StickyNote className="inline h-3 w-3 mr-1" />
              Notes additionnelles
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informations supplémentaires..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Métadonnées en mode édition */}
          {isEditMode && task && (
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
              <div>Créé le : {new Date(task.created_at).toLocaleString('fr-FR')}</div>
              {task.updated_at && (
                <div>Modifié le : {new Date(task.updated_at).toLocaleString('fr-FR')}</div>
              )}
              {task.completed_at && (
                <div>Terminé le : {new Date(task.completed_at).toLocaleString('fr-FR')}</div>
              )}
            </div>
          )}
          
          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Modifier la tâche' : 'Créer la tâche'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}