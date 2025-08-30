/**
 * Test Data Generator for Individuals Management System
 * Generates realistic French family scenarios with proper relationships and data
 */

import { Individual, RelationType } from '@/types/individuals';

// French first names database
const FRENCH_FIRST_NAMES = {
  male: [
    'Antoine', 'Pierre', 'Jean', 'Louis', 'Michel', 'Paul', 'François', 'Nicolas',
    'Philippe', 'Laurent', 'Julien', 'David', 'Christophe', 'Alexandre', 'Sébastien',
    'Maxime', 'Thomas', 'Lucas', 'Hugo', 'Nathan', 'Enzo', 'Léo', 'Gabriel',
    'Raphaël', 'Arthur', 'Noé', 'Adam', 'Jules', 'Maël', 'Théo'
  ],
  female: [
    'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Françoise', 'Monique',
    'Valérie', 'Christine', 'Sandrine', 'Stéphanie', 'Caroline', 'Julie', 'Aurélie',
    'Emma', 'Louise', 'Alice', 'Chloé', 'Manon', 'Sarah', 'Léa', 'Clara',
    'Camille', 'Inès', 'Zoé', 'Lola', 'Jade', 'Anna', 'Rose', 'Amélie'
  ]
};

// French surnames database
const FRENCH_SURNAMES = [
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois',
  'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David',
  'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert',
  'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre',
  'Mercier', 'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'François',
  'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clement', 'Morin'
];

// French cities for birth places
const FRENCH_CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
  'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre',
  'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes',
  'Villeurbanne', 'Clermont-Ferrand', 'Le Mans', 'Aix-en-Provence',
  'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Besançon'
];

// Email domains for realistic emails
const EMAIL_DOMAINS = [
  'gmail.com', 'orange.fr', 'free.fr', 'hotmail.fr', 'yahoo.fr', 
  'wanadoo.fr', 'laposte.net', 'outlook.fr', 'sfr.fr'
];

/**
 * Utility functions for data generation
 */
export class TestDataUtils {
  /**
   * Generate a random element from an array
   */
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random date between two dates
   */
  static randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  /**
   * Generate a birth date for a given age range
   */
  static generateBirthDate(minAge: number, maxAge: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - this.randomInt(minAge, maxAge);
    const birthMonth = this.randomInt(0, 11);
    const daysInMonth = new Date(birthYear, birthMonth + 1, 0).getDate();
    const birthDay = this.randomInt(1, daysInMonth);
    
    return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
  }

  /**
   * Generate a French phone number
   */
  static generatePhoneNumber(): string {
    const prefixes = ['01', '02', '03', '04', '05', '06', '07', '09'];
    const prefix = this.randomChoice(prefixes);
    const numbers = Array.from({ length: 4 }, () => 
      this.randomInt(10, 99).toString()
    ).join(' ');
    return `${prefix} ${numbers}`;
  }

  /**
   * Generate an email address
   */
  static generateEmail(firstName: string, lastName: string): string {
    const domain = this.randomChoice(EMAIL_DOMAINS);
    const variations = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      `${firstName.toLowerCase().charAt(0)}${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${this.randomInt(1, 99)}`
    ];
    
    const localPart = this.randomChoice(variations);
    return `${localPart}@${domain}`;
  }

  /**
   * Generate a random French city
   */
  static generateBirthPlace(): string {
    return this.randomChoice(FRENCH_CITIES);
  }

  /**
   * Generate a random gender
   */
  static generateGender(): 'M' | 'F' {
    return Math.random() > 0.5 ? 'M' : 'F';
  }

  /**
   * Get appropriate first name for gender
   */
  static getFirstName(gender: 'M' | 'F'): string {
    return gender === 'M' 
      ? this.randomChoice(FRENCH_FIRST_NAMES.male)
      : this.randomChoice(FRENCH_FIRST_NAMES.female);
  }

  /**
   * Get random surname
   */
  static getLastName(): string {
    return this.randomChoice(FRENCH_SURNAMES);
  }
}

/**
 * Family scenario definitions
 */
interface FamilyScenario {
  name: string;
  description: string;
  generator: () => Individual[];
}

/**
 * Main test data generator class
 */
export class IndividualTestDataGenerator {
  private scenarioIndex = 0;
  
  /**
   * Pre-defined family scenarios
   */
  private scenarios: FamilyScenario[] = [
    {
      name: 'Jeune couple avec enfant',
      description: 'Couple de jeunes parents avec un enfant en bas âge',
      generator: () => this.generateYoungFamilyScenario()
    },
    {
      name: 'Famille nombreuse',
      description: 'Famille avec plusieurs enfants d\'âges différents',
      generator: () => this.generateLargeFamilyScenario()
    },
    {
      name: 'Famille monoparentale',
      description: 'Parent seul avec enfants',
      generator: () => this.generateSingleParentScenario()
    },
    {
      name: 'Couple senior avec enfant adulte',
      description: 'Couple âgé vivant avec leur enfant adulte',
      generator: () => this.generateSeniorFamilyScenario()
    },
    {
      name: 'Famille élargie',
      description: 'Famille avec grands-parents et petits-enfants',
      generator: () => this.generateExtendedFamilyScenario()
    },
    {
      name: 'Jeunes colocataires',
      description: 'Groupe de jeunes adultes partageant un logement',
      generator: () => this.generateRoommatesScenario()
    }
  ];

  /**
   * Generate a random family scenario
   */
  generateRandomScenario(): Individual[] {
    const scenario = TestDataUtils.randomChoice(this.scenarios);
    return scenario.generator();
  }

  /**
   * Get the next scenario in rotation
   */
  getNextScenario(): Individual[] {
    const scenario = this.scenarios[this.scenarioIndex];
    this.scenarioIndex = (this.scenarioIndex + 1) % this.scenarios.length;
    return scenario.generator();
  }

  /**
   * Get all available scenarios
   */
  getAvailableScenarios(): { name: string; description: string }[] {
    return this.scenarios.map(s => ({ name: s.name, description: s.description }));
  }

  /**
   * Generate a specific scenario by name
   */
  generateSpecificScenario(scenarioName: string): Individual[] {
    const scenario = this.scenarios.find(s => s.name === scenarioName);
    return scenario ? scenario.generator() : this.generateRandomScenario();
  }

  /**
   * Private scenario generators
   */
  private generateYoungFamilyScenario(): Individual[] {
    const familyName = TestDataUtils.getLastName();
    const birthPlace = TestDataUtils.generateBirthPlace();
    
    // Parents (25-35 ans)
    const fatherGender: 'M' = 'M';
    const motherGender: 'F' = 'F';
    
    const father: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(fatherGender),
      date_naissance: TestDataUtils.generateBirthDate(25, 35),
      lieu_naissance: birthPlace,
      sexe: fatherGender,
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: true
    };
    
    // Update email with actual names
    father.email = TestDataUtils.generateEmail(father.prenom, father.nom);
    
    const mother: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(motherGender),
      date_naissance: TestDataUtils.generateBirthDate(23, 33),
      lieu_naissance: TestDataUtils.generateBirthPlace(),
      sexe: motherGender,
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: false
    };
    
    mother.email = TestDataUtils.generateEmail(mother.prenom, mother.nom);
    
    // Enfant (0-5 ans)
    const childGender = TestDataUtils.generateGender();
    const child: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(childGender),
      date_naissance: TestDataUtils.generateBirthDate(0, 5),
      lieu_naissance: birthPlace,
      sexe: childGender,
      relation: 'Enfant' as RelationType,
      isChefFamille: false
    };
    
    return [father, mother, child];
  }

  private generateLargeFamilyScenario(): Individual[] {
    const familyName = TestDataUtils.getLastName();
    const birthPlace = TestDataUtils.generateBirthPlace();
    
    // Parents (30-45 ans)
    const parent1: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('M'),
      date_naissance: TestDataUtils.generateBirthDate(30, 45),
      lieu_naissance: birthPlace,
      sexe: 'M',
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: true
    };
    
    parent1.email = TestDataUtils.generateEmail(parent1.prenom, parent1.nom);
    
    const parent2: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('F'),
      date_naissance: TestDataUtils.generateBirthDate(28, 42),
      lieu_naissance: TestDataUtils.generateBirthPlace(),
      sexe: 'F',
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: false
    };
    
    parent2.email = TestDataUtils.generateEmail(parent2.prenom, parent2.nom);
    
    // Enfants (3-4 enfants d'âges différents)
    const children: Individual[] = [];
    const numChildren = TestDataUtils.randomInt(3, 4);
    
    for (let i = 0; i < numChildren; i++) {
      const childGender = TestDataUtils.generateGender();
      const child: Individual = {
        id: crypto.randomUUID(),
        nom: familyName,
        prenom: TestDataUtils.getFirstName(childGender),
        date_naissance: TestDataUtils.generateBirthDate(2, 18),
        lieu_naissance: birthPlace,
        sexe: childGender,
        relation: 'Enfant' as RelationType,
        isChefFamille: false
      };
      children.push(child);
    }
    
    return [parent1, parent2, ...children];
  }

  private generateSingleParentScenario(): Individual[] {
    const familyName = TestDataUtils.getLastName();
    const birthPlace = TestDataUtils.generateBirthPlace();
    
    // Parent seul (25-40 ans)
    const parentGender = TestDataUtils.generateGender();
    const parent: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(parentGender),
      date_naissance: TestDataUtils.generateBirthDate(25, 40),
      lieu_naissance: birthPlace,
      sexe: parentGender,
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      isChefFamille: true
    };
    
    parent.email = TestDataUtils.generateEmail(parent.prenom, parent.nom);
    
    // Enfants (1-3 enfants)
    const children: Individual[] = [];
    const numChildren = TestDataUtils.randomInt(1, 3);
    
    for (let i = 0; i < numChildren; i++) {
      const childGender = TestDataUtils.generateGender();
      const child: Individual = {
        id: crypto.randomUUID(),
        nom: familyName,
        prenom: TestDataUtils.getFirstName(childGender),
        date_naissance: TestDataUtils.generateBirthDate(3, 16),
        lieu_naissance: birthPlace,
        sexe: childGender,
        relation: 'Enfant' as RelationType,
        isChefFamille: false
      };
      children.push(child);
    }
    
    return [parent, ...children];
  }

  private generateSeniorFamilyScenario(): Individual[] {
    const familyName = TestDataUtils.getLastName();
    const birthPlace = TestDataUtils.generateBirthPlace();
    
    // Couple senior (55-70 ans)
    const senior1: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('M'),
      date_naissance: TestDataUtils.generateBirthDate(55, 70),
      lieu_naissance: birthPlace,
      sexe: 'M',
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: true
    };
    
    senior1.email = TestDataUtils.generateEmail(senior1.prenom, senior1.nom);
    
    const senior2: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('F'),
      date_naissance: TestDataUtils.generateBirthDate(52, 68),
      lieu_naissance: TestDataUtils.generateBirthPlace(),
      sexe: 'F',
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Conjoint' as RelationType,
      isChefFamille: false
    };
    
    senior2.email = TestDataUtils.generateEmail(senior2.prenom, senior2.nom);
    
    // Enfant adulte (25-35 ans)
    const adultChildGender = TestDataUtils.generateGender();
    const adultChild: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(adultChildGender),
      date_naissance: TestDataUtils.generateBirthDate(25, 35),
      lieu_naissance: birthPlace,
      sexe: adultChildGender,
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Enfant' as RelationType,
      isChefFamille: false
    };
    
    adultChild.email = TestDataUtils.generateEmail(adultChild.prenom, adultChild.nom);
    
    return [senior1, senior2, adultChild];
  }

  private generateExtendedFamilyScenario(): Individual[] {
    const familyName = TestDataUtils.getLastName();
    const birthPlace = TestDataUtils.generateBirthPlace();
    
    // Grand-parent (65-80 ans)
    const grandparent: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('F'),
      date_naissance: TestDataUtils.generateBirthDate(65, 80),
      lieu_naissance: birthPlace,
      sexe: 'F',
      telephone: TestDataUtils.generatePhoneNumber(),
      relation: 'Grand-parent' as RelationType,
      isChefFamille: true
    };
    
    // Parent (35-45 ans)
    const parent: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName('M'),
      date_naissance: TestDataUtils.generateBirthDate(35, 45),
      lieu_naissance: TestDataUtils.generateBirthPlace(),
      sexe: 'M',
      telephone: TestDataUtils.generatePhoneNumber(),
      email: TestDataUtils.generateEmail('', ''),
      relation: 'Enfant' as RelationType,
      isChefFamille: false
    };
    
    parent.email = TestDataUtils.generateEmail(parent.prenom, parent.nom);
    
    // Petit-enfant (8-16 ans)
    const grandchildGender = TestDataUtils.generateGender();
    const grandchild: Individual = {
      id: crypto.randomUUID(),
      nom: familyName,
      prenom: TestDataUtils.getFirstName(grandchildGender),
      date_naissance: TestDataUtils.generateBirthDate(8, 16),
      lieu_naissance: birthPlace,
      sexe: grandchildGender,
      relation: 'Petit-enfant' as RelationType,
      isChefFamille: false
    };
    
    return [grandparent, parent, grandchild];
  }

  private generateRoommatesScenario(): Individual[] {
    const individuals: Individual[] = [];
    const numRoommates = TestDataUtils.randomInt(2, 4);
    
    for (let i = 0; i < numRoommates; i++) {
      const gender = TestDataUtils.generateGender();
      const individual: Individual = {
        id: crypto.randomUUID(),
        nom: TestDataUtils.getLastName(),
        prenom: TestDataUtils.getFirstName(gender),
        date_naissance: TestDataUtils.generateBirthDate(20, 30),
        lieu_naissance: TestDataUtils.generateBirthPlace(),
        sexe: gender,
        telephone: TestDataUtils.generatePhoneNumber(),
        email: TestDataUtils.generateEmail('', ''),
        relation: i === 0 ? undefined : 'Autre' as RelationType,
        isChefFamille: i === 0
      };
      
      individual.email = TestDataUtils.generateEmail(individual.prenom, individual.nom);
      individuals.push(individual);
    }
    
    return individuals;
  }
}

/**
 * Default export - singleton instance
 */
export const testDataGenerator = new IndividualTestDataGenerator();