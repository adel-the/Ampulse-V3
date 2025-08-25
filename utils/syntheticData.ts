// Données synthétiques supplémentaires pour enrichir les PDF

export interface SyntheticUserData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresse: string;
  telephone: string;
  email?: string;
  numeroSecu?: string;
  situationFamiliale: string;
  nombreEnfants: number;
  revenus: number;
  prestations: string[];
}

export interface SyntheticHotelData {
  nom: string;
  siret: string;
  tvaIntracommunautaire: string;
  directeur: string;
  telephoneDirecteur: string;
  emailDirecteur: string;
  capacite: number;
  categories: string[];
  services: string[];
  horaires: {
    checkIn: string;
    checkOut: string;
    reception: string;
  };
}

export interface SyntheticOperateurData {
  nom: string;
  prenom: string;
  organisation: string;
  siret: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  telephoneResponsable: string;
  emailResponsable: string;
  agrement: string;
  dateAgrement: string;
  zoneIntervention: string[];
  specialites: string[];
  partenariats: string[];
}

// Données synthétiques des usagers
export const syntheticUsers: SyntheticUserData[] = [
  {
    nom: "Dubois",
    prenom: "Jean",
    dateNaissance: "15/03/1985",
    adresse: "123 rue de la République, 75011 Paris",
    telephone: "06.12.34.56.78",
    email: "jean.dubois@email.com",
    numeroSecu: "185031512345678",
    situationFamiliale: "Célibataire",
    nombreEnfants: 0,
    revenus: 850,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Martin",
    prenom: "Marie",
    dateNaissance: "22/07/1992",
    adresse: "45 avenue Jean Jaurès, 75019 Paris",
    telephone: "06.98.76.54.32",
    email: "marie.martin@email.com",
    numeroSecu: "192072298765432",
    situationFamiliale: "Divorcée",
    nombreEnfants: 2,
    revenus: 1200,
    prestations: ["RSA", "APL", "Allocation familiale"]
  },
  {
    nom: "Bernard",
    prenom: "Pierre",
    dateNaissance: "08/11/1978",
    adresse: "67 rue Saint-Antoine, 75004 Paris",
    telephone: "06.45.67.89.01",
    numeroSecu: "178110845678901",
    situationFamiliale: "Marié",
    nombreEnfants: 1,
    revenus: 1500,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Thomas",
    prenom: "Sophie",
    dateNaissance: "30/05/1989",
    adresse: "89 avenue Parmentier, 75011 Paris",
    telephone: "06.23.45.67.89",
    email: "sophie.thomas@email.com",
    numeroSecu: "189053023456789",
    situationFamiliale: "Célibataire",
    nombreEnfants: 0,
    revenus: 950,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Petit",
    prenom: "Michel",
    dateNaissance: "12/09/1982",
    adresse: "34 rue de Charonne, 75011 Paris",
    telephone: "06.78.90.12.34",
    numeroSecu: "182091278901234",
    situationFamiliale: "Séparé",
    nombreEnfants: 3,
    revenus: 1100,
    prestations: ["RSA", "APL", "Allocation familiale"]
  },
  {
    nom: "Robert",
    prenom: "Catherine",
    dateNaissance: "25/12/1995",
    adresse: "56 boulevard Ménilmontant, 75020 Paris",
    telephone: "06.90.12.34.56",
    email: "catherine.robert@email.com",
    numeroSecu: "195122590123456",
    situationFamiliale: "Célibataire",
    nombreEnfants: 0,
    revenus: 800,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Richard",
    prenom: "André",
    dateNaissance: "03/04/1975",
    adresse: "78 rue Oberkampf, 75011 Paris",
    telephone: "06.34.56.78.90",
    numeroSecu: "175040334567890",
    situationFamiliale: "Divorcé",
    nombreEnfants: 1,
    revenus: 1300,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Durand",
    prenom: "Isabelle",
    dateNaissance: "18/08/1987",
    adresse: "91 avenue de la République, 75011 Paris",
    telephone: "06.56.78.90.12",
    email: "isabelle.durand@email.com",
    numeroSecu: "187081856789012",
    situationFamiliale: "Mariée",
    nombreEnfants: 2,
    revenus: 1400,
    prestations: ["RSA", "APL", "Allocation familiale"]
  },
  {
    nom: "Leroy",
    prenom: "Philippe",
    dateNaissance: "07/01/1980",
    adresse: "123 rue du Faubourg Saint-Antoine, 75012 Paris",
    telephone: "06.67.89.01.23",
    numeroSecu: "180010767890123",
    situationFamiliale: "Célibataire",
    nombreEnfants: 0,
    revenus: 1000,
    prestations: ["RSA", "APL"]
  },
  {
    nom: "Moreau",
    prenom: "Anne",
    dateNaissance: "14/06/1990",
    adresse: "45 boulevard Beaumarchais, 75003 Paris",
    telephone: "06.89.01.23.45",
    email: "anne.moreau@email.com",
    numeroSecu: "190061489012345",
    situationFamiliale: "Célibataire",
    nombreEnfants: 0,
    revenus: 900,
    prestations: ["RSA", "APL"]
  }
];

// Données synthétiques des hôtels
export const syntheticHotels: SyntheticHotelData[] = [
  {
    nom: "Résidence Saint-Martin",
    siret: "12345678901234",
    tvaIntracommunautaire: "FR12345678901",
    directeur: "Marie Dubois",
    telephoneDirecteur: "01.42.00.01.01",
    emailDirecteur: "directeur@residence-saint-martin.fr",
    capacite: 45,
    categories: ["Hébergement d'urgence", "Insertion sociale"],
    services: ["Accompagnement social", "Restaurant", "Blanchisserie", "Salle commune"],
    horaires: {
      checkIn: "14h00",
      checkOut: "11h00",
      reception: "24h/24"
    }
  },
  {
    nom: "Foyer Solidaire Belleville",
    siret: "23456789012345",
    tvaIntracommunautaire: "FR23456789012",
    directeur: "Pierre Martin",
    telephoneDirecteur: "01.42.00.02.02",
    emailDirecteur: "directeur@foyer-belleville.fr",
    capacite: 32,
    categories: ["Hébergement temporaire", "Accompagnement social"],
    services: ["Accompagnement social", "Cuisine équipée", "Salle d'activités", "Jardin"],
    horaires: {
      checkIn: "15h00",
      checkOut: "10h00",
      reception: "7h00-22h00"
    }
  },
  {
    nom: "Hôtel d'Accueil Républicain",
    siret: "34567890123456",
    tvaIntracommunautaire: "FR34567890123",
    directeur: "Sophie Lemoine",
    telephoneDirecteur: "01.42.00.03.03",
    emailDirecteur: "directeur@hotel-accueil-republicain.fr",
    capacite: 28,
    categories: ["Hébergement d'urgence", "Insertion professionnelle"],
    services: ["Accompagnement social", "Ateliers d'insertion", "Salle informatique", "Restaurant"],
    horaires: {
      checkIn: "14h00",
      checkOut: "11h00",
      reception: "24h/24"
    }
  },
  {
    nom: "Centre d'Hébergement Voltaire",
    siret: "45678901234567",
    tvaIntracommunautaire: "FR45678901234",
    directeur: "Jean Moreau",
    telephoneDirecteur: "01.42.00.04.04",
    emailDirecteur: "directeur@centre-voltaire.fr",
    capacite: 38,
    categories: ["Hébergement temporaire", "Accompagnement santé"],
    services: ["Accompagnement social", "Infirmerie", "Salle de repos", "Restaurant"],
    horaires: {
      checkIn: "15h00",
      checkOut: "10h00",
      reception: "7h00-23h00"
    }
  },
  {
    nom: "Résidence Temporaire Victor Hugo",
    siret: "56789012345678",
    tvaIntracommunautaire: "FR56789012345",
    directeur: "Anne Petit",
    telephoneDirecteur: "01.42.00.05.05",
    emailDirecteur: "directeur@residence-victor-hugo.fr",
    capacite: 25,
    categories: ["Hébergement temporaire", "Accompagnement famille"],
    services: ["Accompagnement social", "Garde d'enfants", "Salle de jeux", "Cuisine équipée"],
    horaires: {
      checkIn: "14h00",
      checkOut: "11h00",
      reception: "8h00-20h00"
    }
  }
];

// Données synthétiques des opérateurs sociaux
export const syntheticOperateurs: SyntheticOperateurData[] = [
  {
    nom: "Dubois",
    prenom: "Marie",
    organisation: "SIAO 75 - Paris",
    siret: "12345678901234",
    adresse: "15 rue Jean Baptiste Berlier, 75013 Paris",
    telephone: "01.42.00.10.10",
    email: "marie.dubois@siao75.fr",
    responsable: "Jean Dupont",
    telephoneResponsable: "01.42.00.10.11",
    emailResponsable: "jean.dupont@siao75.fr",
    agrement: "AG-2024-001",
    dateAgrement: "01/01/2024",
    zoneIntervention: ["Paris 11e", "Paris 12e", "Paris 20e"],
    specialites: ["Urgence sociale", "Accompagnement global"],
    partenariats: ["SAMUSOCIAL DE PARIS", "Croix-Rouge", "Armée du Salut"]
  },
  {
    nom: "Martin",
    prenom: "Sophie",
    organisation: "Emmaüs Solidarité",
    siret: "23456789012345",
    adresse: "47 rue de la Commune de Paris, 75019 Paris",
    telephone: "01.42.00.20.20",
    email: "sophie.martin@emmaus-solidarite.fr",
    responsable: "Pierre Durand",
    telephoneResponsable: "01.42.00.20.21",
    emailResponsable: "pierre.durand@emmaus-solidarite.fr",
    agrement: "AG-2024-002",
    dateAgrement: "15/01/2024",
    zoneIntervention: ["Paris 19e", "Paris 20e", "Montreuil"],
    specialites: ["Accompagnement global", "Insertion professionnelle"],
    partenariats: ["SAMUSOCIAL DE PARIS", "Fondation Abbé Pierre"]
  },
  {
    nom: "Bernard",
    prenom: "Catherine",
    organisation: "Secours Catholique",
    siret: "34567890123456",
    adresse: "106 rue du Bac, 75007 Paris",
    telephone: "01.42.00.30.30",
    email: "catherine.bernard@secours-catholique.fr",
    responsable: "Michel Leroy",
    telephoneResponsable: "01.42.00.30.31",
    emailResponsable: "michel.leroy@secours-catholique.fr",
    agrement: "AG-2024-003",
    dateAgrement: "01/02/2024",
    zoneIntervention: ["Paris 7e", "Paris 8e", "Paris 9e"],
    specialites: ["Accompagnement famille", "Accompagnement santé"],
    partenariats: ["SAMUSOCIAL DE PARIS", "Croix-Rouge"]
  },
  {
    nom: "Thomas",
    prenom: "Isabelle",
    organisation: "CCAS Paris 11e",
    siret: "45678901234567",
    adresse: "12 place Léon Blum, 75011 Paris",
    telephone: "01.42.00.40.40",
    email: "isabelle.thomas@ccas-paris11.fr",
    responsable: "André Moreau",
    telephoneResponsable: "01.42.00.40.41",
    emailResponsable: "andre.moreau@ccas-paris11.fr",
    agrement: "AG-2024-004",
    dateAgrement: "15/02/2024",
    zoneIntervention: ["Paris 11e"],
    specialites: ["Urgence sociale", "Accompagnement seniors"],
    partenariats: ["SAMUSOCIAL DE PARIS", "SIAO 75"]
  },
  {
    nom: "Petit",
    prenom: "Anne",
    organisation: "Mission locale Paris",
    siret: "56789012345678",
    adresse: "23 rue de la Roquette, 75011 Paris",
    telephone: "01.42.00.50.50",
    email: "anne.petit@mission-locale-paris.fr",
    responsable: "Philippe Simon",
    telephoneResponsable: "01.42.00.50.51",
    emailResponsable: "philippe.simon@mission-locale-paris.fr",
    agrement: "AG-2024-005",
    dateAgrement: "01/03/2024",
    zoneIntervention: ["Paris 11e", "Paris 12e"],
    specialites: ["Insertion professionnelle", "Accompagnement jeunes"],
    partenariats: ["SAMUSOCIAL DE PARIS", "SIAO 75"]
  }
];

// Fonctions utilitaires pour récupérer les données synthétiques
export const getSyntheticUserData = (nom: string, prenom: string): SyntheticUserData | undefined => {
  return syntheticUsers.find(user => 
    user.nom.toLowerCase() === nom.toLowerCase() && 
    user.prenom.toLowerCase() === prenom.toLowerCase()
  );
};

export const getSyntheticHotelData = (nom: string): SyntheticHotelData | undefined => {
  return syntheticHotels.find(hotel => 
    hotel.nom.toLowerCase().includes(nom.toLowerCase()) || 
    nom.toLowerCase().includes(hotel.nom.toLowerCase())
  );
};

export const getSyntheticOperateurData = (organisation: string): SyntheticOperateurData | undefined => {
  return syntheticOperateurs.find(operateur => 
    operateur.organisation.toLowerCase().includes(organisation.toLowerCase()) || 
    organisation.toLowerCase().includes(operateur.organisation.toLowerCase())
  );
};

// Données pour les occupants des chambres
export const getOccupantsForReservation = (reservationId: number): string[] => {
  const occupants = [
    ["DIABY Amara", "DIABY Matrou", "DIABY Almamy-MoustaphaJunior"],
    ["MARTIN Jean", "MARTIN Marie"],
    ["DUBOIS Pierre", "DUBOIS Sophie", "DUBOIS Paul"],
    ["BERNARD Michel", "BERNARD Catherine"],
    ["THOMAS André", "THOMAS Isabelle"],
    ["PETIT Philippe", "PETIT Anne", "PETIT Luc"],
    ["ROBERT Alain", "ROBERT Claire"],
    ["RICHARD Bernard", "RICHARD Nathalie"],
    ["DURAND Daniel", "DURAND Valérie"],
    ["LEROY Christian", "LEROY Sandrine"]
  ];
  
  return occupants[reservationId % occupants.length];
};

// Données pour les informations complémentaires
export const getComplementaryInfo = (reservationId: number): string => {
  const infos = [
    "Accompagnement social en cours - Suivi régulier",
    "Accompagnement social en cours - Recherche de logement",
    "Accompagnement social en cours - Insertion professionnelle",
    "Accompagnement social en cours - Accompagnement santé",
    "Accompagnement social en cours - Accompagnement famille",
    "Accompagnement social en cours - Accompagnement jeunes",
    "Accompagnement social en cours - Accompagnement seniors",
    "Accompagnement social en cours - Accompagnement migrants",
    "Accompagnement social en cours - Accompagnement femmes",
    "Accompagnement social en cours - Accompagnement global"
  ];
  
  return infos[reservationId % infos.length];
};

// Données pour les motifs de prolongation
export const getProlongationMotif = (reservationId: number): string => {
  const motifs = [
    "Accompagnement social en cours - Recherche de logement permanent",
    "Accompagnement social en cours - Attente de décision administrative",
    "Accompagnement social en cours - Soins médicaux en cours",
    "Accompagnement social en cours - Formation professionnelle",
    "Accompagnement social en cours - Accompagnement familial",
    "Accompagnement social en cours - Insertion professionnelle",
    "Accompagnement social en cours - Accompagnement santé mentale",
    "Accompagnement social en cours - Accompagnement addiction",
    "Accompagnement social en cours - Accompagnement handicap",
    "Accompagnement social en cours - Accompagnement global"
  ];
  
  return motifs[reservationId % motifs.length];
};

// Données pour les motifs de fin de prise en charge
export const getFinPriseChargeMotif = (reservationId: number): string => {
  const motifs = [
    "Accompagnement social terminé - Logement permanent trouvé",
    "Accompagnement social terminé - Insertion professionnelle réussie",
    "Accompagnement social terminé - Retour en famille",
    "Accompagnement social terminé - Déménagement vers autre région",
    "Accompagnement social terminé - Autonomie retrouvée",
    "Accompagnement social terminé - Accompagnement santé terminé",
    "Accompagnement social terminé - Accompagnement familial terminé",
    "Accompagnement social terminé - Accompagnement jeunes terminé",
    "Accompagnement social terminé - Accompagnement seniors terminé",
    "Accompagnement social terminé - Accompagnement global terminé"
  ];
  
  return motifs[reservationId % motifs.length];
};

// Templates de documents
export const documentTemplates = [
  {
    id: 1,
    nom: "Bon de réservation",
    type: "bon_reservation" as const,
    description: "Document de confirmation de réservation",
    contenu: `BON DE RÉSERVATION

EN-TÊTE EXPÉDITEUR:
Voyages Services Plus
Tour Liberty 17 place des Reflets
92400 Courbevoie
reservation@vesta-operateursolidaire.fr

INFORMATIONS DESTINATAIRE:
Nom: {{nom_usager}}
Établissement: {{nom_hotel}}

DÉTAILS DE LA RÉSERVATION:
Numéro de dossier: {{numero_dossier}}
Date d'arrivée: {{date_arrivee}}
Date de départ: {{date_depart}}
Nombre de nuits: {{nombre_nuits}}
Nombre de personnes: {{nombre_personnes}}
Montant total: {{montant_total}}€
Prescripteur: {{prescripteur}}
Statut: {{statut}}

INFORMATIONS COMPLÉMENTAIRES:
Téléphone: {{telephone}}
Email: {{email}}
Adresse: {{adresse}}
Ville: {{ville}}
Code postal: {{code_postal}}
Handicap: {{handicap}}
Accompagnement: {{accompagnement}}
Nombre d'accompagnants: {{nombre_accompagnants}}
Notes: {{notes}}

Date de génération: {{date_generation}}`,
    variables: [
      { nom: "nom_usager", description: "Nom de l'usager", type: "texte" as const, obligatoire: true },
      { nom: "nom_hotel", description: "Nom de l'hôtel", type: "texte" as const, obligatoire: true },
      { nom: "date_arrivee", description: "Date d'arrivée", type: "date" as const, obligatoire: true },
      { nom: "date_depart", description: "Date de départ", type: "date" as const, obligatoire: true },
      { nom: "nombre_nuits", description: "Nombre de nuits", type: "nombre" as const, obligatoire: true },
      { nom: "montant_total", description: "Montant total", type: "montant" as const, obligatoire: true },
      { nom: "prescripteur", description: "Prescripteur", type: "texte" as const, obligatoire: true }
    ],
    statut: "actif" as const,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    version: "1.0",
    format: "pdf" as const
  },
  {
    id: 2,
    nom: "Prolongation de réservation",
    type: "prolongation_reservation" as const,
    description: "Document de prolongation de réservation",
    contenu: `PROLONGATION DE RÉSERVATION

EN-TÊTE EXPÉDITEUR:
Voyages Services Plus
Tour Liberty 17 place des Reflets
92400 Courbevoie
reservation@vesta-operateursolidaire.fr

INFORMATIONS DESTINATAIRE:
Nom: {{nom_usager}}
Établissement: {{nom_hotel}}

DÉTAILS DE LA PROLONGATION:
Numéro de dossier: {{numero_dossier}}
Date d'arrivée initiale: {{date_arrivee}}
Nouvelle date de départ: {{date_depart}}
Nombre de nuits: {{nombre_nuits}}
Prescripteur: {{prescripteur}}
Statut: {{statut}}

MOTIF DE LA PROLONGATION:
Extension de la période d'hébergement d'urgence

Date de génération: {{date_generation}}`,
    variables: [
      { nom: "nom_usager", description: "Nom de l'usager", type: "texte" as const, obligatoire: true },
      { nom: "nom_hotel", description: "Nom de l'hôtel", type: "texte" as const, obligatoire: true },
      { nom: "date_arrivee", description: "Date d'arrivée", type: "date" as const, obligatoire: true },
      { nom: "date_depart", description: "Nouvelle date de départ", type: "date" as const, obligatoire: true },
      { nom: "nombre_nuits", description: "Nombre de nuits", type: "nombre" as const, obligatoire: true },
      { nom: "prescripteur", description: "Prescripteur", type: "texte" as const, obligatoire: true }
    ],
    statut: "actif" as const,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    version: "1.0",
    format: "pdf" as const
  },
  {
    id: 3,
    nom: "Fin de prise en charge",
    type: "fin_prise_charge" as const,
    description: "Document de fin de prise en charge",
    contenu: `FIN DE PRISE EN CHARGE

EN-TÊTE EXPÉDITEUR:
Voyages Services Plus
Tour Liberty 17 place des Reflets
92400 Courbevoie
reservation@vesta-operateursolidaire.fr

INFORMATIONS DESTINATAIRE:
Nom: {{nom_usager}}
Établissement: {{nom_hotel}}

DÉTAILS DE LA FIN DE PRISE EN CHARGE:
Numéro de dossier: {{numero_dossier}}
Date d'arrivée: {{date_arrivee}}
Date de fin: {{date_depart}}
Nombre de nuits: {{nombre_nuits}}
Prescripteur: {{prescripteur}}
Statut: {{statut}}

MOTIF DE LA FIN DE PRISE EN CHARGE:
Fin de la période d'hébergement d'urgence

Date de génération: {{date_generation}}`,
    variables: [
      { nom: "nom_usager", description: "Nom de l'usager", type: "texte" as const, obligatoire: true },
      { nom: "nom_hotel", description: "Nom de l'hôtel", type: "texte" as const, obligatoire: true },
      { nom: "date_arrivee", description: "Date d'arrivée", type: "date" as const, obligatoire: true },
      { nom: "date_depart", description: "Date de fin", type: "date" as const, obligatoire: true },
      { nom: "nombre_nuits", description: "Nombre de nuits", type: "nombre" as const, obligatoire: true },
      { nom: "prescripteur", description: "Prescripteur", type: "texte" as const, obligatoire: true }
    ],
    statut: "actif" as const,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    version: "1.0",
    format: "pdf" as const
  },
  {
    id: 4,
    nom: "Facture",
    type: "facture" as const,
    description: "Document de facturation",
    contenu: `FACTURE

EN-TÊTE EXPÉDITEUR:
Voyages Services Plus
Tour Liberty 17 place des Reflets
92400 Courbevoie
reservation@vesta-operateursolidaire.fr
SIRET: 12345678901234
TVA Intracommunautaire: FR12345678901

INFORMATIONS DESTINATAIRE:
Nom: {{nom_usager}}
Adresse: {{adresse}}
Ville: {{ville}}
Code postal: {{code_postal}}
Téléphone: {{telephone}}
Email: {{email}}

DÉTAILS DE LA FACTURE:
Numéro de facture: {{numero_facture}}
Date de facture: {{date_facture}}
Numéro de dossier: {{numero_dossier}}
Établissement: {{nom_hotel}}
Prescripteur: {{prescripteur}}

DÉTAIL DES PRESTATIONS:
Hébergement d'urgence
- Date d'arrivée: {{date_arrivee}}
- Date de départ: {{date_depart}}
- Nombre de nuits: {{nombre_nuits}}
- Prix par nuit: {{prix_nuit}}€
- Montant total: {{montant_total}}€

TVA: {{tva}}€
Montant HT: {{montant_ht}}€
Montant TTC: {{montant_ttc}}€

CONDITIONS DE PAIEMENT:
Paiement à 30 jours
IBAN: FR76 1234 5678 9012 3456 7890 123
BIC: ABCDEFGHIJK

Date de génération: {{date_generation}}`,
    variables: [
      { nom: "nom_usager", description: "Nom de l'usager", type: "texte" as const, obligatoire: true },
      { nom: "adresse", description: "Adresse de l'usager", type: "adresse" as const, obligatoire: false },
      { nom: "ville", description: "Ville de l'usager", type: "texte" as const, obligatoire: false },
      { nom: "code_postal", description: "Code postal de l'usager", type: "texte" as const, obligatoire: false },
      { nom: "telephone", description: "Téléphone de l'usager", type: "telephone" as const, obligatoire: false },
      { nom: "email", description: "Email de l'usager", type: "email" as const, obligatoire: false },
      { nom: "numero_facture", description: "Numéro de facture", type: "texte" as const, obligatoire: true },
      { nom: "date_facture", description: "Date de facture", type: "date" as const, obligatoire: true },
      { nom: "numero_dossier", description: "Numéro de dossier", type: "texte" as const, obligatoire: true },
      { nom: "nom_hotel", description: "Nom de l'hôtel", type: "texte" as const, obligatoire: true },
      { nom: "prescripteur", description: "Prescripteur", type: "texte" as const, obligatoire: true },
      { nom: "date_arrivee", description: "Date d'arrivée", type: "date" as const, obligatoire: true },
      { nom: "date_depart", description: "Date de départ", type: "date" as const, obligatoire: true },
      { nom: "nombre_nuits", description: "Nombre de nuits", type: "nombre" as const, obligatoire: true },
      { nom: "prix_nuit", description: "Prix par nuit", type: "montant" as const, obligatoire: true },
      { nom: "montant_total", description: "Montant total", type: "montant" as const, obligatoire: true },
      { nom: "tva", description: "Montant TVA", type: "montant" as const, obligatoire: true },
      { nom: "montant_ht", description: "Montant HT", type: "montant" as const, obligatoire: true },
      { nom: "montant_ttc", description: "Montant TTC", type: "montant" as const, obligatoire: true }
    ],
    statut: "actif" as const,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    version: "1.0",
    format: "pdf" as const
  }
]; 