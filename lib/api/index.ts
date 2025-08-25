/**
 * API Layer Index
 * Centralized exports for all API modules
 */

// Establishments API
export { 
  establishmentsApi,
  getEstablishments,
  getEstablishment,
  getEstablishmentWithDetails,
  createEstablishment,
  updateEstablishment,
  deleteEstablishment,
  getEstablishmentStatistics,
  searchEstablishments,
  toggleEstablishmentStatus
} from './establishments'

// Rooms API
export { 
  roomsApi,
  getRooms,
  getRoomsByHotel,
  getRoomsByCategory,
  getRoom,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomStatistics,
  searchRooms,
  updateRoomStatus,
  checkRoomAvailability,
  getAvailableRooms
} from './rooms'

// Equipments API
export { 
  equipmentsApi,
  getEquipments,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  searchEquipments
} from './equipments'

// Types
export type { 
  Establishment,
  EstablishmentInsert,
  EstablishmentUpdate 
} from './establishments'

export type { 
  Room,
  RoomInsert,
  RoomUpdate 
} from './rooms'

export type { 
  Equipment,
  EquipmentInsert,
  EquipmentUpdate
} from './equipments'