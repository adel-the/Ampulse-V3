import React from 'react';
import { 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  Building2, 
  Clock,
  MoreHorizontal,
  Eye,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Avatar, AvatarFallback } from './avatar';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  statut: 'actif' | 'inactif';
  hotelId?: number;
  dateCreation: string;
  derniereConnexion?: string;
}

interface UserCardProps {
  user: User;
  hotelName?: string;
  roleDefinition?: {
    nom: string;
    icon: string;
    couleur: string;
  };
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onToggleStatus: (userId: number) => void;
  onViewDetails: (user: User) => void;
  isSelected?: boolean;
  onSelect?: (userId: number) => void;
}

export default function UserCard({
  user,
  hotelName,
  roleDefinition,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
  isSelected = false,
  onSelect
}: UserCardProps) {
  const initials = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  
  const statusColor = user.statut === 'actif' 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : 'bg-red-100 text-red-800 border-red-200';

  const getStatusIcon = () => {
    if (user.statut === 'actif') {
      return <UserCheck className="h-3 w-3 text-green-600" />;
    }
    return <AlertCircle className="h-3 w-3 text-red-600" />;
  };

  return (
    <div className={`
      group relative bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
    `}>
      {/* Checkbox pour sélection multiple */}
      {onSelect && (
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(user.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Section principale */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback 
                  className="text-white font-semibold"
                  style={{ backgroundColor: roleDefinition?.couleur || '#6B7280' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                {getStatusIcon()}
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {user.prenom} {user.nom}
                </h3>
                <Badge 
                  variant="outline"
                  className={`${statusColor} border text-xs`}
                >
                  {user.statut}
                </Badge>
              </div>

              {/* Contact */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.telephone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span>{user.telephone}</span>
                  </div>
                )}
              </div>

              {/* Badges rôle et établissement */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge 
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{roleDefinition?.icon || '👤'}</span>
                  <span>{roleDefinition?.nom || user.role}</span>
                </Badge>
                {hotelName && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate max-w-[8rem]">{hotelName}</span>
                  </Badge>
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Créé le {user.dateCreation}</span>
                {user.derniereConnexion && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Vu le {user.derniereConnexion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu d'actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails(user)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(user.id)}>
                {user.statut === 'actif' ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(user.id)}
                className="text-red-600 focus:text-red-600"
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
} 