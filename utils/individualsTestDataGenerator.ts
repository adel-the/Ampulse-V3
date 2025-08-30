// Comprehensive Test Data Generator for Individuals Management System
// Generates realistic French family/individual data for hotel PMS testing

import { Individual } from '../types/individuals';

// Define the actual relation type from the interface (not the constant which has 'Petit-enfant')
type ActualRelationType = 'Conjoint' | 'Enfant' | 'Parent' | 'Frère/Sœur' | 'Grand-parent' | 'Autre';

// French first names by gender
const FRENCH_MALE_NAMES = [
  'Pierre', 'Jean', 'Michel', 'Philippe', 'Alain', 'Bernard', 'Christian', 'Daniel', 'Laurent', 'Patrick',
  'Nicolas', 'David', 'Julien', 'Sébastien', 'Christophe', 'Stéphane', 'Frédéric', 'Antoine', 'Alexandre', 'Thomas',
  'Maxime', 'Lucas', 'Louis', 'Gabriel', 'Arthur', 'Hugo', 'Nathan', 'Léo', 'Raphaël', 'Paul',
  'Emmanuel', 'François', 'Olivier', 'Marc', 'Henri', 'André', 'Claude', 'Pascal', 'Yves', 'Gérard'
];

const FRENCH_FEMALE_NAMES = [
  'Marie', 'Martine', 'Christine', 'Monique', 'Sylvie', 'Françoise', 'Catherine', 'Nathalie', 'Isabelle', 'Véronique',
  'Sophie', 'Anne', 'Brigitte', 'Julie', 'Patricia', 'Sandrine', 'Céline', 'Valérie', 'Dominique', 'Stéphanie',
  'Emma', 'Louise', 'Chloé', 'Camille', 'Manon', 'Sarah', 'Léa', 'Clara', 'Inès', 'Jade',
  'Élise', 'Amélie', 'Charlotte', 'Pauline', 'Marine', 'Caroline', 'Laure', 'Audrey', 'Émilie', 'Hélène'
];

// French family names
const FRENCH_FAMILY_NAMES = [
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
  'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
  'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Müller', 'Mercier', 'Boyer', 'Blanc',
  'Guerin', 'Muller', 'Garnier', 'Faure', 'Roche', 'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier',
  'Leclerc', 'Lefevre', 'Marchand', 'Dufour', 'Garcia', 'Schneider', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez'
];

// French cities for birth places
const FRENCH_BIRTH_CITIES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille',
  'Rennes', 'Reims', 'Le Havre', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Aix-en-Provence',
  'Saint-Étienne', 'Tours', 'Clermont-Ferrand', 'Orléans', 'Metz', 'Rouen', 'Mulhouse', 'Perpignan', 'Caen', 'Boulogne-Billancourt',
  'Nancy', 'Argenteuil', 'Roubaix', 'Tourcoing', 'Nanterre', 'Avignon', 'Versailles', 'Créteil', 'Poitiers', 'Courbevoie',
  'Amiens', 'Limoges', 'Pau', 'La Rochelle', 'Calais', 'Cannes', 'Antibes', 'Brest', 'Lorient', 'Bayonne'
];

// Family scenario configurations
interface FamilyScenario {
  type: string;
  description: string;
  members: {
    relation?: ActualRelationType;
    ageRange: [number, number];
    gender?: 'M' | 'F';
    contactProbability: number;
  }[];
}

const FAMILY_SCENARIOS: FamilyScenario[] = [
  {
    type: 'nuclear_family',
    description: 'Famille nucléaire classique avec 2 enfants',
    members: [
      { relation: 'Conjoint', ageRange: [28, 45], gender: 'F', contactProbability: 0.8 },
      { relation: 'Enfant', ageRange: [3, 12], contactProbability: 0.2 },
      { relation: 'Enfant', ageRange: [8, 16], contactProbability: 0.3 }
    ]
  },
  {
    type: 'single_parent',
    description: 'Parent seul avec adolescent',
    members: [
      { relation: 'Enfant', ageRange: [14, 17], contactProbability: 0.6 }
    ]
  },
  {
    type: 'couple_no_children',
    description: 'Couple sans enfants',
    members: [
      { relation: 'Conjoint', ageRange: [25, 40], gender: 'F', contactProbability: 0.9 }
    ]
  },
  {
    type: 'extended_family',
    description: 'Famille élargie avec grands-parents',
    members: [
      { relation: 'Conjoint', ageRange: [32, 48], gender: 'F', contactProbability: 0.7 },
      { relation: 'Enfant', ageRange: [5, 10], contactProbability: 0.1 },
      { relation: 'Grand-parent', ageRange: [65, 80], contactProbability: 0.4 }
    ]
  },
  {
    type: 'sibling_group',
    description: 'Groupe de frères et sœurs',
    members: [
      { relation: 'Frère/Sœur', ageRange: [22, 28], contactProbability: 0.8 },
      { relation: 'Frère/Sœur', ageRange: [25, 31], contactProbability: 0.7 },
      { relation: 'Frère/Sœur', ageRange: [28, 34], contactProbability: 0.6 }
    ]
  },
  {
    type: 'large_family',
    description: 'Famille nombreuse avec 3 enfants',
    members: [
      { relation: 'Conjoint', ageRange: [30, 42], gender: 'F', contactProbability: 0.8 },
      { relation: 'Enfant', ageRange: [2, 6], contactProbability: 0.1 },
      { relation: 'Enfant', ageRange: [7, 11], contactProbability: 0.2 },
      { relation: 'Enfant', ageRange: [12, 16], contactProbability: 0.4 }
    ]
  },
  {
    type: 'mixed_relationships',
    description: 'Relations mixtes (amis, colocataires)',
    members: [
      { relation: 'Autre', ageRange: [24, 35], contactProbability: 0.9 },
      { relation: 'Autre', ageRange: [26, 38], contactProbability: 0.8 }
    ]
  },
  {
    type: 'three_generation',
    description: 'Trois générations sous le même toit',
    members: [
      { relation: 'Conjoint', ageRange: [35, 45], gender: 'F', contactProbability: 0.8 },
      { relation: 'Enfant', ageRange: [8, 14], contactProbability: 0.3 },
      { relation: 'Parent', ageRange: [60, 75], contactProbability: 0.5 }
    ]
  }
];

// Utility functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAge(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBirthDate(age: number): string {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-end issues
  
  return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function generateFrenchPhoneNumber(): string {
  const prefixes = ['01', '02', '03', '04', '05', '06', '07', '09'];
  const prefix = getRandomElement(prefixes);
  const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${number}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const providers = ['gmail.com', 'outlook.fr', 'yahoo.fr', 'orange.fr', 'free.fr', 'hotmail.fr'];
  const provider = getRandomElement(providers);
  const separator = getRandomElement(['.', '_', '']);
  const normalizedFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return `${normalizedFirst}${separator}${normalizedLast}@${provider}`;
}

function determineGender(firstName: string, suggestedGender?: 'M' | 'F'): 'M' | 'F' | 'Autre' {
  if (suggestedGender) return suggestedGender;
  
  if (FRENCH_MALE_NAMES.includes(firstName)) return 'M';
  if (FRENCH_FEMALE_NAMES.includes(firstName)) return 'F';
  
  // Fallback for unisex names or unknown names
  return Math.random() > 0.5 ? 'M' : 'F';
}

function selectName(gender: 'M' | 'F' | 'Autre'): string {
  if (gender === 'M') {
    return getRandomElement(FRENCH_MALE_NAMES);
  } else if (gender === 'F') {
    return getRandomElement(FRENCH_FEMALE_NAMES);
  } else {
    // For 'Autre', randomly pick from either list
    return getRandomElement([...FRENCH_MALE_NAMES, ...FRENCH_FEMALE_NAMES]);
  }
}

// Main generator function
export function generateIndividualsTestData(): Individual[] {
  const scenario = getRandomElement(FAMILY_SCENARIOS);
  const familyName = getRandomElement(FRENCH_FAMILY_NAMES);
  const individuals: Individual[] = [];
  
  scenario.members.forEach((member, index) => {
    const age = getRandomAge(member.ageRange[0], member.ageRange[1]);
    const gender = member.gender || (Math.random() > 0.5 ? 'M' : 'F');
    const firstName = selectName(gender);
    const hasContact = Math.random() < member.contactProbability;
    
    const individual: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: firstName,
      date_naissance: generateBirthDate(age),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: determineGender(firstName, gender),
      relation: member.relation,
      isChefFamille: false,
      // Optional contact information
      telephone: hasContact && Math.random() > 0.3 ? generateFrenchPhoneNumber() : undefined,
      email: hasContact && Math.random() > 0.5 ? generateEmail(firstName, familyName) : undefined
    };
    
    individuals.push(individual);
  });
  
  return individuals;
}

// Generate specific family scenarios
export function generateNuclearFamily(): Individual[] {
  const familyName = getRandomElement(FRENCH_FAMILY_NAMES);
  
  return [
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_FEMALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(28, 42)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'F',
      telephone: generateFrenchPhoneNumber(),
      email: generateEmail('marie', familyName),
      relation: 'Conjoint',
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_MALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(6, 12)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'M',
      relation: 'Enfant',
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_FEMALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(3, 8)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'F',
      relation: 'Enfant',
      isChefFamille: false
    }
  ];
}

export function generateSingleParentFamily(): Individual[] {
  const familyName = getRandomElement(FRENCH_FAMILY_NAMES);
  
  return [
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_MALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(15, 17)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'M',
      telephone: Math.random() > 0.5 ? generateFrenchPhoneNumber() : undefined,
      relation: 'Enfant',
      isChefFamille: false
    }
  ];
}

export function generateExtendedFamily(): Individual[] {
  const familyName = getRandomElement(FRENCH_FAMILY_NAMES);
  
  return [
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_FEMALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(32, 45)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'F',
      telephone: generateFrenchPhoneNumber(),
      email: generateEmail('sophie', familyName),
      relation: 'Conjoint',
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_FEMALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(5, 10)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'F',
      relation: 'Enfant',
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: getRandomElement(FRENCH_MALE_NAMES),
      date_naissance: generateBirthDate(getRandomAge(65, 78)),
      lieu_naissance: getRandomElement(FRENCH_BIRTH_CITIES),
      sexe: 'M',
      telephone: Math.random() > 0.6 ? generateFrenchPhoneNumber() : undefined,
      relation: 'Grand-parent' as ActualRelationType,
      isChefFamille: false
    }
  ];
}

// Generate predefined scenarios for consistent testing
export const PREDEFINED_FAMILIES = {
  famille_martin: (): Individual[] => [
    {
      id: crypto.randomUUID(),
      nom: 'Martin',
      prenom: 'Claire',
      date_naissance: '1985-03-15',
      lieu_naissance: 'Lyon',
      sexe: 'F' as const,
      telephone: '0145123456',
      email: 'claire.martin@email.fr',
      relation: 'Conjoint' as ActualRelationType,
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: 'Martin',
      prenom: 'Lucas',
      date_naissance: '2012-09-22',
      lieu_naissance: 'Lyon',
      sexe: 'M' as const,
      relation: 'Enfant' as ActualRelationType,
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: 'Martin',
      prenom: 'Emma',
      date_naissance: '2015-12-08',
      lieu_naissance: 'Lyon',
      sexe: 'F' as const,
      relation: 'Enfant' as ActualRelationType,
      isChefFamille: false
    }
  ],

  groupe_dupont: (): Individual[] => [
    {
      id: crypto.randomUUID(),
      nom: 'Dupont',
      prenom: 'Maxime',
      date_naissance: '2007-06-18',
      lieu_naissance: 'Paris',
      sexe: 'M' as const,
      telephone: '0678912345',
      relation: 'Enfant' as ActualRelationType,
      isChefFamille: false
    }
  ],

  couple_bernard: (): Individual[] => [
    {
      id: crypto.randomUUID(),
      nom: 'Bernard',
      prenom: 'Françoise',
      date_naissance: '1962-11-30',
      lieu_naissance: 'Marseille',
      sexe: 'F' as const,
      telephone: '0423567890',
      email: 'francoise.bernard@orange.fr',
      relation: 'Conjoint' as ActualRelationType,
      isChefFamille: false
    }
  ],

  fratrie_laurent: (): Individual[] => [
    {
      id: crypto.randomUUID(),
      nom: 'Laurent',
      prenom: 'Antoine',
      date_naissance: '1995-02-14',
      lieu_naissance: 'Toulouse',
      sexe: 'M' as const,
      telephone: '0756123789',
      email: 'antoine.laurent@gmail.com',
      relation: 'Frère/Sœur' as ActualRelationType,
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: 'Laurent',
      prenom: 'Camille',
      date_naissance: '1997-08-03',
      lieu_naissance: 'Toulouse',
      sexe: 'F' as const,
      telephone: '0687456123',
      relation: 'Frère/Sœur' as ActualRelationType,
      isChefFamille: false
    },
    {
      id: crypto.randomUUID(),
      nom: 'Laurent',
      prenom: 'Thomas',
      date_naissance: '1992-12-25',
      lieu_naissance: 'Toulouse',
      sexe: 'M' as const,
      email: 'thomas.laurent@outlook.fr',
      relation: 'Frère/Sœur' as ActualRelationType,
      isChefFamille: false
    }
  ]
};

// Main export function with rotation logic
let lastScenarioIndex = -1;

export function generateVariedIndividualsTestData(): Individual[] {
  const scenarios = Object.values(PREDEFINED_FAMILIES);
  
  // Rotate through scenarios to ensure variety
  lastScenarioIndex = (lastScenarioIndex + 1) % scenarios.length;
  
  // 70% chance to use predefined scenarios, 30% chance for random generation
  if (Math.random() < 0.7) {
    return scenarios[lastScenarioIndex]();
  } else {
    return generateIndividualsTestData();
  }
}

// Export individual items
export { FAMILY_SCENARIOS };

// Export all generator functions
export default {
  generateIndividualsTestData,
  generateVariedIndividualsTestData,
  generateNuclearFamily,
  generateSingleParentFamily,
  generateExtendedFamily,
  PREDEFINED_FAMILIES,
  FAMILY_SCENARIOS
};