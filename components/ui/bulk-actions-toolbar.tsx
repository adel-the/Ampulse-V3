import React from 'react';
import { 
  UserPlus, 
  Download, 
  Upload, 
  Trash2, 
  Lock, 
  Unlock,
  Mail,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface BulkActionsToolbarProps {
  selectedUsers: number[];
  totalUsers: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  onBulkEmail: () => void;
  onAddUser: () => void;
  onImportUsers: () => void;
  onExportUsers: () => void;
}

export default function BulkActionsToolbar({
  selectedUsers,
  totalUsers,
  onSelectAll,
  onDeselectAll,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkEmail,
  onAddUser,
  onImportUsers,
  onExportUsers
}: BulkActionsToolbarProps) {
  const hasSelection = selectedUsers.length > 0;
  const allSelected = selectedUsers.length === totalUsers;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Section gauche - Sélection */}
        <div className="flex items-center gap-4">
          {hasSelection ? (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4 mr-1" />
                Désélectionner
              </Button>

              {!allSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Sélectionner tout
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Gestion des utilisateurs
              </h2>
              <Badge variant="outline" className="text-gray-600">
                {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Section droite - Actions */}
        <div className="flex items-center gap-2">
          {hasSelection ? (
            /* Actions en masse */
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkActivate}
                className="text-green-600 hover:text-green-700 hover:border-green-300"
              >
                <Unlock className="h-4 w-4 mr-1" />
                Activer
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDeactivate}
                className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
              >
                <Lock className="h-4 w-4 mr-1" />
                Désactiver
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEmail}
                className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
              >
                <Mail className="h-4 w-4 mr-1" />
                Envoyer email
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          ) : (
            /* Actions principales */
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportUsers}
                className="text-gray-600"
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onImportUsers}
                className="text-gray-600"
              >
                <Upload className="h-4 w-4 mr-1" />
                Importer
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              <Button
                onClick={onAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Avertissements pour les actions en masse */}
      {hasSelection && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-sm text-amber-800">
              Attention : Les actions en masse affecteront {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}. 
              Cette action ne peut pas être annulée.
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 