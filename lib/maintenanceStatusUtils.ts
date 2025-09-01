import { 
  RoomMaintenanceStatus, 
  MAINTENANCE_STATUS_LABELS, 
  MAINTENANCE_STATUS_DESCRIPTIONS,
  MaintenanceStatusInfo 
} from '@/types';
import { 
  CheckCircle, 
  Bed, 
  Wrench, 
  AlertTriangle, 
  AlertCircle,
  XCircle,
  Clock,
  Settings
} from 'lucide-react';

/**
 * Get comprehensive information about a maintenance status
 */
export function getMaintenanceStatusInfo(status: RoomMaintenanceStatus): MaintenanceStatusInfo {
  switch (status) {
    case 'disponible':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: 'CheckCircle',
        canBeReserved: true,
        priorityLevel: 'low'
      };

    case 'occupee':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: 'Bed',
        canBeReserved: false,
        priorityLevel: 'medium'
      };

    case 'maintenance':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: 'Wrench',
        canBeReserved: false,
        priorityLevel: 'high'
      };

    case 'maintenance_disponible':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        description: MAINTENANCE_STATUS_DESCRIPTIONS[status],
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
        icon: 'Settings',
        canBeReserved: true,
        priorityLevel: 'low'
      };

    case 'maintenance_occupee':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        description: MAINTENANCE_STATUS_DESCRIPTIONS[status],
        color: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
        icon: 'Clock',
        canBeReserved: false,
        priorityLevel: 'medium'
      };

    case 'maintenance_hors_usage':
      return {
        status,
        label: MAINTENANCE_STATUS_LABELS[status],
        description: MAINTENANCE_STATUS_DESCRIPTIONS[status],
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: 'XCircle',
        canBeReserved: false,
        priorityLevel: 'critical'
      };

    default:
      return {
        status: 'disponible',
        label: 'Inconnu',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: 'AlertTriangle',
        canBeReserved: false,
        priorityLevel: 'medium'
      };
  }
}

/**
 * Get the appropriate Lucide React icon component for a status
 */
export function getStatusIcon(status: RoomMaintenanceStatus) {
  const info = getMaintenanceStatusInfo(status);
  
  switch (info.icon) {
    case 'CheckCircle':
      return CheckCircle;
    case 'Bed':
      return Bed;
    case 'Wrench':
      return Wrench;
    case 'Settings':
      return Settings;
    case 'Clock':
      return Clock;
    case 'XCircle':
      return XCircle;
    case 'AlertCircle':
      return AlertCircle;
    default:
      return AlertTriangle;
  }
}

/**
 * Get CSS classes for status badge
 */
export function getStatusBadgeClasses(status: RoomMaintenanceStatus): string {
  const info = getMaintenanceStatusInfo(status);
  return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color} ${info.bgColor}`;
}

/**
 * Get valid status transitions for a given current status
 */
export function getValidStatusTransitions(currentStatus: RoomMaintenanceStatus): RoomMaintenanceStatus[] {
  switch (currentStatus) {
    case 'disponible':
      return ['occupee', 'maintenance', 'maintenance_disponible', 'maintenance_hors_usage'];
      
    case 'occupee':
      return ['disponible', 'maintenance_occupee', 'maintenance_hors_usage'];
      
    case 'maintenance':
      return ['disponible', 'maintenance_disponible', 'maintenance_occupee', 'maintenance_hors_usage'];
      
    case 'maintenance_disponible':
      return ['disponible', 'occupee', 'maintenance', 'maintenance_hors_usage'];
      
    case 'maintenance_occupee':
      return ['occupee', 'maintenance', 'maintenance_disponible', 'maintenance_hors_usage'];
      
    case 'maintenance_hors_usage':
      return ['disponible', 'maintenance', 'maintenance_disponible'];
      
    default:
      return ['disponible', 'occupee', 'maintenance'];
  }
}

/**
 * Check if a status change requires confirmation
 */
export function requiresConfirmation(currentStatus: RoomMaintenanceStatus, newStatus: RoomMaintenanceStatus): boolean {
  // Critical transitions that need confirmation
  const criticalTransitions = [
    // From occupied to any maintenance
    { from: 'occupee', to: ['maintenance', 'maintenance_hors_usage', 'maintenance_disponible'] },
    // From any status to out of service
    { from: '*', to: ['maintenance_hors_usage'] },
    // From occupied maintenance to available
    { from: 'maintenance_occupee', to: ['disponible'] },
    // From out of service to occupied
    { from: 'maintenance_hors_usage', to: ['occupee'] }
  ];

  return criticalTransitions.some(transition => {
    const fromMatches = transition.from === '*' || transition.from === currentStatus;
    const toMatches = transition.to.includes(newStatus);
    return fromMatches && toMatches;
  });
}

/**
 * Get confirmation message for status change
 */
export function getConfirmationMessage(currentStatus: RoomMaintenanceStatus, newStatus: RoomMaintenanceStatus): string {
  const currentInfo = getMaintenanceStatusInfo(currentStatus);
  const newInfo = getMaintenanceStatusInfo(newStatus);

  if (currentStatus === 'occupee' && ['maintenance', 'maintenance_hors_usage', 'maintenance_disponible'].includes(newStatus)) {
    return `⚠️ Cette chambre est actuellement occupée. Assurez-vous que l'usager a été informé${newStatus === 'maintenance_hors_usage' ? ' et relocalisé' : ''} avant de passer en ${newInfo.label.toLowerCase()}.`;
  }

  if (newStatus === 'maintenance_hors_usage') {
    return `🚨 Attention : Cette chambre sera marquée comme "Hors d'usage" et ne pourra plus être réservée. Confirmez-vous cette action critique ?`;
  }

  if (currentStatus === 'maintenance_occupee' && newStatus === 'disponible') {
    return `ℹ️ Assurez-vous que la maintenance est terminée et que l'usager a quitté la chambre avant de la marquer comme disponible.`;
  }

  if (currentStatus === 'maintenance_hors_usage' && newStatus === 'occupee') {
    return `ℹ️ Assurez-vous que toutes les réparations sont terminées et que la chambre est en parfait état avant de l'occuper.`;
  }

  return `Confirmer le changement de "${currentInfo.label}" vers "${newInfo.label}" ?`;
}

/**
 * Filter rooms by maintenance priority level
 */
export function filterRoomsByPriority(rooms: any[], priorityLevel?: 'low' | 'medium' | 'high' | 'critical') {
  if (!priorityLevel) return rooms;
  
  return rooms.filter(room => {
    const statusInfo = getMaintenanceStatusInfo(room.statut);
    return statusInfo.priorityLevel === priorityLevel;
  });
}

/**
 * Sort rooms by maintenance priority
 */
export function sortRoomsByMaintenancePriority(rooms: any[]) {
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  
  return [...rooms].sort((a, b) => {
    const aInfo = getMaintenanceStatusInfo(a.statut);
    const bInfo = getMaintenanceStatusInfo(b.statut);
    return priorityOrder[aInfo.priorityLevel] - priorityOrder[bInfo.priorityLevel];
  });
}