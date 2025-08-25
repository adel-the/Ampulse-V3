// Synthetic Data Generator for PMS System Testing
import { faker } from '@faker-js/faker/locale/fr';

// Types for synthetic data
export interface SyntheticHotel {
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type_etablissement: 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre';
  telephone: string;
  email: string;
  site_web?: string;
  gestionnaire: string;
  statut: 'ACTIF' | 'INACTIF';
  siret?: string;
  tva_intracommunautaire?: string;
  classement_etoiles?: number;
  directeur: string;
  telephone_directeur: string;
  email_directeur: string;
  capacite: number;
  description: string;
  check_in_time?: string;
  check_out_time?: string;
  parking_places: number;
  surface_totale: number;
  nombre_etages: number;
  chambres_total: number;
  chambres_occupees: number;
  taux_occupation: number;
}

export interface SyntheticRoom {
  numero: string;
  type: string;
  prix: number;
  statut: 'disponible' | 'occupee' | 'maintenance';
  description: string;
  floor: number;
  room_size: number;
  bed_type: string;
  view_type: string;
  is_smoking: boolean;
  amenities: string[];
  notes?: string;
}

export interface SyntheticEquipment {
  nom: string;
  description: string;
  categorie: string;
  icone: string;
  est_premium: boolean;
  est_disponible: boolean;
  est_gratuit: boolean;
  prix_supplement?: number;
}

// French cities for realistic data
const frenchCities = [
  { ville: 'Paris', codePostal: '75001' },
  { ville: 'Lyon', codePostal: '69001' },
  { ville: 'Marseille', codePostal: '13001' },
  { ville: 'Toulouse', codePostal: '31000' },
  { ville: 'Nice', codePostal: '06000' },
  { ville: 'Nantes', codePostal: '44000' },
  { ville: 'Strasbourg', codePostal: '67000' },
  { ville: 'Montpellier', codePostal: '34000' },
  { ville: 'Bordeaux', codePostal: '33000' },
  { ville: 'Lille', codePostal: '59000' },
  { ville: 'Rennes', codePostal: '35000' },
  { ville: 'Reims', codePostal: '51100' },
  { ville: 'Saint-Étienne', codePostal: '42000' },
  { ville: 'Toulon', codePostal: '83000' },
  { ville: 'Le Havre', codePostal: '76600' },
  { ville: 'Grenoble', codePostal: '38000' },
  { ville: 'Dijon', codePostal: '21000' },
  { ville: 'Angers', codePostal: '49000' },
  { ville: 'Nîmes', codePostal: '30000' },
  { ville: 'Clermont-Ferrand', codePostal: '63000' }
];

// Hotel name prefixes and suffixes for variety
const hotelPrefixes = ['Hôtel', 'Le', 'La', 'Les', 'Résidence', 'Domaine', 'Château', 'Villa', 'Maison'];
const hotelSuffixes = ['Royal', 'Palace', 'Plaza', 'Grand', 'Moderne', 'Élégant', 'Luxe', 'Confort', 'Étoilé', 
                        'du Parc', 'de la Gare', 'du Centre', 'de la Plage', 'des Voyageurs', 'du Commerce',
                        'Beau Rivage', 'Belle Vue', 'Soleil', 'de France'];

// Room types with realistic pricing
const roomTypes = [
  { type: 'Simple', basePrice: 45, capacity: 1, size: 15 },
  { type: 'Double', basePrice: 65, capacity: 2, size: 20 },
  { type: 'Twin', basePrice: 65, capacity: 2, size: 20 },
  { type: 'Triple', basePrice: 85, capacity: 3, size: 25 },
  { type: 'Familiale', basePrice: 95, capacity: 4, size: 30 },
  { type: 'Suite', basePrice: 120, capacity: 2, size: 35 },
  { type: 'Suite Junior', basePrice: 150, capacity: 2, size: 40 },
  { type: 'Suite Executive', basePrice: 200, capacity: 2, size: 50 },
  { type: 'PMR', basePrice: 55, capacity: 2, size: 25 },
  { type: 'Studio', basePrice: 55, capacity: 2, size: 22 }
];

// Bed types
const bedTypes = [
  'Lit simple',
  'Lit double',
  'Lits jumeaux',
  'Lit Queen Size',
  'Lit King Size',
  'Lits superposés',
  'Canapé-lit',
  'Lits multiples'
];

// View types
const viewTypes = [
  'Vue mer',
  'Vue jardin',
  'Vue ville',
  'Vue cour intérieure',
  'Vue montagne',
  'Vue piscine',
  'Vue parc',
  'Sans vue particulière'
];

// Common amenities
const commonAmenities = [
  'WiFi', 'TV', 'Climatisation', 'Chauffage', 'Minibar', 'Coffre-fort',
  'Salle de bain privée', 'Douche', 'Baignoire', 'Sèche-cheveux',
  'Bureau', 'Téléphone', 'Machine à café', 'Bouilloire',
  'Fer à repasser', 'Service en chambre'
];

// Generate synthetic hotel data
export function generateSyntheticHotel(): SyntheticHotel {
  const city = faker.helpers.arrayElement(frenchCities);
  const stars = faker.number.int({ min: 1, max: 5 });
  const totalRooms = faker.number.int({ min: 10, max: 200 });
  const occupiedRooms = faker.number.int({ min: 0, max: totalRooms });
  
  const prefix = faker.helpers.arrayElement(hotelPrefixes);
  const suffix = faker.helpers.arrayElement(hotelSuffixes);
  const hotelName = `${prefix} ${suffix}`;
  
  return {
    nom: hotelName,
    adresse: faker.location.streetAddress(),
    ville: city.ville,
    code_postal: city.codePostal,
    type_etablissement: faker.helpers.arrayElement(['hotel', 'residence', 'foyer', 'chrs', 'chr', 'autre']),
    telephone: faker.phone.number('01########'),
    email: faker.internet.email({ provider: 'hotel-example.fr' }),
    site_web: faker.internet.url(),
    gestionnaire: faker.person.fullName(),
    statut: faker.helpers.arrayElement(['ACTIF', 'INACTIF']),
    siret: faker.string.numeric(14),
    tva_intracommunautaire: `FR${faker.string.numeric(11)}`,
    classement_etoiles: stars,
    directeur: faker.person.fullName(),
    telephone_directeur: faker.phone.number('06########'),
    email_directeur: faker.internet.email({ provider: 'hotel-example.fr' }),
    capacite: totalRooms * 2,
    description: faker.lorem.paragraph(),
    check_in_time: faker.helpers.arrayElement(['14:00', '15:00', '16:00']),
    check_out_time: faker.helpers.arrayElement(['10:00', '11:00', '12:00']),
    parking_places: faker.number.int({ min: 5, max: 50 }),
    surface_totale: faker.number.float({ min: 500, max: 5000, precision: 0.01 }),
    nombre_etages: faker.number.int({ min: 1, max: 10 }),
    chambres_total: totalRooms,
    chambres_occupees: occupiedRooms,
    taux_occupation: parseFloat(((occupiedRooms / totalRooms) * 100).toFixed(2))
  };
}

// Generate synthetic room data
export function generateSyntheticRoom(floorCount: number = 5): SyntheticRoom {
  const roomType = faker.helpers.arrayElement(roomTypes);
  const floor = faker.number.int({ min: 0, max: floorCount });
  const roomNumber = `${floor}${faker.string.numeric(2, { allowLeadingZeros: true })}`;
  
  // Price variation based on floor and randomness
  const priceVariation = faker.number.float({ min: 0.8, max: 1.3, precision: 0.01 });
  const floorBonus = floor > 3 ? 1.1 : 1;
  const finalPrice = Math.round(roomType.basePrice * priceVariation * floorBonus);
  
  // Random amenities selection
  const numberOfAmenities = faker.number.int({ min: 3, max: 10 });
  const selectedAmenities = faker.helpers.arrayElements(commonAmenities, numberOfAmenities);
  
  return {
    numero: roomNumber,
    type: roomType.type,
    prix: finalPrice,
    statut: faker.helpers.weighted(
      ['disponible', 'occupee', 'maintenance'],
      [60, 35, 5]
    ),
    description: `${roomType.type} ${faker.helpers.arrayElement(['confortable', 'moderne', 'récemment rénovée', 'spacieuse', 'élégante'])}`,
    floor: floor,
    room_size: roomType.size + faker.number.int({ min: -3, max: 5 }),
    bed_type: faker.helpers.arrayElement(bedTypes),
    view_type: faker.helpers.arrayElement(viewTypes),
    is_smoking: faker.datatype.boolean({ probability: 0.1 }),
    amenities: selectedAmenities,
    notes: faker.datatype.boolean({ probability: 0.3 }) 
      ? faker.lorem.sentence() 
      : undefined
  };
}

// Generate synthetic equipment associations
export function generateSyntheticEquipmentAssociation(): SyntheticEquipment {
  const equipmentTypes = [
    { nom: 'WiFi Premium', categorie: 'connectivity', icone: 'Wifi', premium: true },
    { nom: 'Parking Couvert', categorie: 'services', icone: 'Car', premium: true },
    { nom: 'Spa Access', categorie: 'wellness', icone: 'Sparkles', premium: true },
    { nom: 'Room Service 24/7', categorie: 'services', icone: 'Coffee', premium: false },
    { nom: 'Gym Access', categorie: 'wellness', icone: 'Dumbbell', premium: false },
    { nom: 'Business Center', categorie: 'services', icone: 'Monitor', premium: false },
    { nom: 'Concierge Service', categorie: 'services', icone: 'Users', premium: true },
    { nom: 'Kids Club', categorie: 'recreation', icone: 'Baby', premium: false },
    { nom: 'Restaurant Gastronomique', categorie: 'services', icone: 'Utensils', premium: true },
    { nom: 'Bar Lounge', categorie: 'services', icone: 'Wine', premium: false }
  ];
  
  const equipment = faker.helpers.arrayElement(equipmentTypes);
  const isGratuit = faker.datatype.boolean({ probability: 0.6 });
  
  return {
    nom: equipment.nom,
    description: faker.lorem.sentence(),
    categorie: equipment.categorie,
    icone: equipment.icone,
    est_premium: equipment.premium,
    est_disponible: faker.datatype.boolean({ probability: 0.9 }),
    est_gratuit: isGratuit,
    prix_supplement: !isGratuit ? faker.number.float({ min: 5, max: 50, precision: 0.01 }) : undefined
  };
}

// Generate multiple synthetic hotels
export function generateMultipleHotels(count: number): SyntheticHotel[] {
  return Array.from({ length: count }, () => generateSyntheticHotel());
}

// Generate multiple synthetic rooms for a hotel
export function generateRoomsForHotel(hotelFloors: number, roomCount: number): SyntheticRoom[] {
  const rooms: SyntheticRoom[] = [];
  const usedNumbers = new Set<string>();
  
  for (let i = 0; i < roomCount; i++) {
    let room: SyntheticRoom;
    let attempts = 0;
    
    do {
      room = generateSyntheticRoom(hotelFloors);
      attempts++;
    } while (usedNumbers.has(room.numero) && attempts < 100);
    
    if (!usedNumbers.has(room.numero)) {
      usedNumbers.add(room.numero);
      rooms.push(room);
    }
  }
  
  return rooms;
}

// Generate test scenario data
export function generateTestScenario() {
  const hotels = generateMultipleHotels(3);
  const scenario = {
    hotels: hotels,
    rooms: {} as Record<string, SyntheticRoom[]>,
    equipments: [] as SyntheticEquipment[]
  };
  
  // Generate rooms for each hotel
  hotels.forEach((hotel, index) => {
    const roomCount = faker.number.int({ min: 10, max: 30 });
    scenario.rooms[`hotel_${index}`] = generateRoomsForHotel(hotel.nombre_etages, roomCount);
  });
  
  // Generate equipment associations
  scenario.equipments = Array.from({ length: 10 }, () => generateSyntheticEquipmentAssociation());
  
  return scenario;
}

// Generate update data for testing modifications
export function generateUpdateData(entityType: 'hotel' | 'room' | 'equipment') {
  switch (entityType) {
    case 'hotel':
      return {
        description: faker.lorem.paragraph(),
        telephone: faker.phone.number('01########'),
        email: faker.internet.email({ provider: 'updated-hotel.fr' }),
        classement_etoiles: faker.number.int({ min: 1, max: 5 }),
        statut: faker.helpers.arrayElement(['ACTIF', 'INACTIF'])
      };
    
    case 'room':
      return {
        prix: faker.number.float({ min: 40, max: 300, precision: 0.01 }),
        statut: faker.helpers.arrayElement(['disponible', 'occupee', 'maintenance']),
        description: faker.lorem.sentence(),
        amenities: faker.helpers.arrayElements(commonAmenities, faker.number.int({ min: 3, max: 8 }))
      };
    
    case 'equipment':
      return {
        est_disponible: faker.datatype.boolean(),
        est_gratuit: faker.datatype.boolean(),
        prix_supplement: faker.number.float({ min: 5, max: 100, precision: 0.01 }),
        description_specifique: faker.lorem.sentence()
      };
    
    default:
      return {};
  }
}

export default {
  generateSyntheticHotel,
  generateSyntheticRoom,
  generateSyntheticEquipmentAssociation,
  generateMultipleHotels,
  generateRoomsForHotel,
  generateTestScenario,
  generateUpdateData
};