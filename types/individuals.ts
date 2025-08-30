// Types pour la gestion des individus liés à un usager
export interface Individual {
  id: string; // ID temporaire généré côté client
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: 'M' | 'F' | 'Autre';
  telephone?: string;
  email?: string;
  relation?: 'Conjoint' | 'Enfant' | 'Parent' | 'Frère/Sœur' | 'Grand-parent' | 'Autre';
  isChefFamille: boolean; // Toujours false pour les individus (chef = usager principal)
}

// Extension du formData existant
export interface UsagerFormDataWithIndividuals {
  // Données usager existantes
  prescripteur_id: number | null;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  autonomie_level: string;
  statut: string;
  
  // Nouveaux individus
  individuals: Individual[];
}

// Erreurs de validation pour individus
export interface IndividualErrors {
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  relation?: string;
}

// Constantes pour les relations
export const RELATIONS = [
  'Conjoint',
  'Enfant', 
  'Parent',
  'Frère/Sœur',
  'Grand-parent',
  'Petit-enfant',
  'Autre'
] as const;

export type RelationType = typeof RELATIONS[number];

// Utilitaires
export const createEmptyIndividual = (): Individual => ({
  id: crypto.randomUUID(),
  nom: '',
  prenom: '',
  date_naissance: '',
  lieu_naissance: '',
  sexe: undefined,
  telephone: '',
  email: '',
  relation: undefined,
  isChefFamille: false
});

export const validateIndividual = (individual: Individual): IndividualErrors => {
  const errors: IndividualErrors = {};

  if (!individual.nom.trim()) {
    errors.nom = 'Le nom est obligatoire';
  }

  if (!individual.prenom.trim()) {
    errors.prenom = 'Le prénom est obligatoire';
  }

  if (individual.date_naissance) {
    const birthDate = new Date(individual.date_naissance);
    const today = new Date();
    
    if (birthDate > today) {
      errors.date_naissance = 'La date ne peut pas être dans le futur';
    }
    
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age > 120) {
      errors.date_naissance = 'Date invalide';
    }
  }

  return errors;
};

export const formatAge = (dateNaissance?: string): string | null => {
  if (!dateNaissance) return null;
  const birthDate = new Date(dateNaissance);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return `${age - 1} ans`;
  }
  
  return `${age} ans`;
};