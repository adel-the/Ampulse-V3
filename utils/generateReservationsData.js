const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Données synthétiques pour les usagers
const usagersData = [
  { nom: 'Dupont', prenom: 'Marie', date_naissance: '1985-03-15', adresse: '123 Rue de la Paix, Paris', telephone: '0123456789', email: 'marie.dupont@email.com', numero_secu: '1234567890123', situation_familiale: 'célibataire', nombre_enfants: 0, revenus: 1200.00, prestations: ['RSA', 'APL'] },
  { nom: 'Martin', prenom: 'Jean', date_naissance: '1978-07-22', adresse: '456 Avenue des Fleurs, Lyon', telephone: '0987654321', email: 'jean.martin@email.com', numero_secu: '2345678901234', situation_familiale: 'divorcé', nombre_enfants: 2, revenus: 1800.00, prestations: ['RSA', 'Allocation familiale'] },
  { nom: 'Bernard', prenom: 'Sophie', date_naissance: '1990-11-08', adresse: '789 Boulevard Central, Marseille', telephone: '0567891234', email: 'sophie.bernard@email.com', numero_secu: '3456789012345', situation_familiale: 'célibataire', nombre_enfants: 1, revenus: 950.00, prestations: ['RSA'] },
  { nom: 'Petit', prenom: 'Pierre', date_naissance: '1982-04-30', adresse: '321 Rue du Commerce, Toulouse', telephone: '0678912345', email: 'pierre.petit@email.com', numero_secu: '4567890123456', situation_familiale: 'marié', nombre_enfants: 3, revenus: 2200.00, prestations: ['Allocation familiale'] },
  { nom: 'Robert', prenom: 'Claire', date_naissance: '1988-09-12', adresse: '654 Place de la République, Nantes', telephone: '0789123456', email: 'claire.robert@email.com', numero_secu: '5678901234567', situation_familiale: 'célibataire', nombre_enfants: 0, revenus: 1100.00, prestations: ['RSA', 'APL'] },
  { nom: 'Richard', prenom: 'Michel', date_naissance: '1975-12-03', adresse: '987 Rue Saint-Michel, Bordeaux', telephone: '0891234567', email: 'michel.richard@email.com', numero_secu: '6789012345678', situation_familiale: 'divorcé', nombre_enfants: 1, revenus: 1600.00, prestations: ['RSA'] },
  { nom: 'Durand', prenom: 'Isabelle', date_naissance: '1992-06-18', adresse: '147 Avenue Victor Hugo, Nice', telephone: '0912345678', email: 'isabelle.durand@email.com', numero_secu: '7890123456789', situation_familiale: 'célibataire', nombre_enfants: 0, revenus: 1300.00, prestations: ['RSA', 'APL'] },
  { nom: 'Moreau', prenom: 'François', date_naissance: '1980-01-25', adresse: '258 Boulevard de la Liberté, Lille', telephone: '0123456789', email: 'francois.moreau@email.com', numero_secu: '8901234567890', situation_familiale: 'marié', nombre_enfants: 2, revenus: 1900.00, prestations: ['Allocation familiale'] },
  { nom: 'Simon', prenom: 'Nathalie', date_naissance: '1987-08-14', adresse: '369 Rue de la Gare, Strasbourg', telephone: '0234567890', email: 'nathalie.simon@email.com', numero_secu: '9012345678901', situation_familiale: 'célibataire', nombre_enfants: 1, revenus: 1400.00, prestations: ['RSA'] },
  { nom: 'Michel', prenom: 'Laurent', date_naissance: '1983-05-07', adresse: '741 Place du Marché, Rennes', telephone: '0345678901', email: 'laurent.michel@email.com', numero_secu: '0123456789012', situation_familiale: 'divorcé', nombre_enfants: 0, revenus: 1700.00, prestations: ['RSA', 'APL'] }
];

// Données synthétiques pour les opérateurs sociaux
const operateursData = [
  { nom: 'Dubois', prenom: 'Anne', organisation: 'Association Solidarité Plus', telephone: '0123456789', email: 'anne.dubois@solidarite-plus.fr', statut: 'actif', specialite: 'Accompagnement social', zone_intervention: 'Paris et banlieue', siret: '12345678901234', adresse: '123 Rue de la Solidarité, Paris', responsable: 'Jean Dubois', telephone_responsable: '0987654321', email_responsable: 'jean.dubois@solidarite-plus.fr', agrement: 'AG-2023-001', date_agrement: '2023-01-15', zone_intervention_array: ['Paris', 'Seine-Saint-Denis', 'Hauts-de-Seine'], specialites: ['Accompagnement social', 'Insertion professionnelle'], partenariats: ['Pôle Emploi', 'CAF'] },
  { nom: 'Leroy', prenom: 'Marc', organisation: 'Fondation Aide et Soutien', telephone: '0987654321', email: 'marc.leroy@aide-soutien.fr', statut: 'actif', specialite: 'Hébergement d\'urgence', zone_intervention: 'Lyon et région', siret: '23456789012345', adresse: '456 Avenue de l\'Aide, Lyon', responsable: 'Marie Leroy', telephone_responsable: '0567891234', email_responsable: 'marie.leroy@aide-soutien.fr', agrement: 'AG-2023-002', date_agrement: '2023-02-20', zone_intervention_array: ['Lyon', 'Rhône', 'Isère'], specialites: ['Hébergement d\'urgence', 'Accompagnement social'], partenariats: ['115', 'SAMU Social'] },
  { nom: 'Garcia', prenom: 'Carmen', organisation: 'Association Espoir', telephone: '0567891234', email: 'carmen.garcia@espoir.fr', statut: 'actif', specialite: 'Accompagnement familial', zone_intervention: 'Marseille et Provence', siret: '34567890123456', adresse: '789 Boulevard de l\'Espoir, Marseille', responsable: 'Pedro Garcia', telephone_responsable: '0678912345', email_responsable: 'pedro.garcia@espoir.fr', agrement: 'AG-2023-003', date_agrement: '2023-03-10', zone_intervention_array: ['Marseille', 'Bouches-du-Rhône', 'Var'], specialites: ['Accompagnement familial', 'Protection de l\'enfance'], partenariats: ['ASE', 'PMI'] }
];

// Fonction pour générer des dates aléatoires dans les 6 prochains mois
function generateRandomDates() {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  
  const dateArrivee = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const duree = Math.floor(Math.random() * 30) + 1; // 1 à 30 jours
  const dateDepart = new Date(dateArrivee);
  dateDepart.setDate(dateDepart.getDate() + duree);
  
  return {
    date_arrivee: dateArrivee.toISOString().split('T')[0],
    date_depart: dateDepart.toISOString().split('T')[0],
    duree: duree
  };
}

// Fonction pour générer des prix aléatoires
function generateRandomPrice() {
  return Math.floor(Math.random() * 50) + 30; // 30€ à 80€ par nuit
}

// Fonction pour générer des statuts de réservation
function generateRandomStatus() {
  const statuses = ['CONFIRMEE', 'EN_COURS', 'TERMINEE'];
  const weights = [0.6, 0.3, 0.1]; // 60% confirmées, 30% en cours, 10% terminées
  
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return statuses[i];
    }
  }
  return statuses[0];
}

// Fonction pour générer des prescripteurs
function generateRandomPrescripteur() {
  const prescripteurs = [
    'Service Social Départemental',
    'Association Caritas',
    'Croix-Rouge Française',
    'Secours Populaire',
    'Armée du Salut',
    'Fondation de France',
    'Mairie de Paris',
    'CCAS',
    'Pôle Emploi',
    'Mission Locale'
  ];
  return prescripteurs[Math.floor(Math.random() * prescripteurs.length)];
}

async function generateReservationsData() {
  try {
    console.log('🚀 Début de la génération des données synthétiques...');

    // 1. Récupérer les hôtels existants
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom');

    if (hotelsError) {
      console.error('Erreur lors de la récupération des hôtels:', hotelsError);
      return;
    }

    console.log(`📋 ${hotels.length} hôtels trouvés`);

    // 2. Récupérer les chambres existantes
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, hotel_id, numero, type_chambre, prix_nuit');

    if (roomsError) {
      console.error('Erreur lors de la récupération des chambres:', roomsError);
      return;
    }

    console.log(`🏠 ${rooms.length} chambres trouvées`);

    // 3. Insérer les usagers s'ils n'existent pas
    console.log('👥 Insertion des usagers...');
    for (const usager of usagersData) {
      const { error } = await supabase
        .from('usagers')
        .upsert(usager, { onConflict: 'email' });
      
      if (error) {
        console.error('Erreur lors de l\'insertion de l\'usager:', error);
      }
    }

    // 4. Insérer les opérateurs sociaux s'ils n'existent pas
    console.log('🏢 Insertion des opérateurs sociaux...');
    for (const operateur of operateursData) {
      const { error } = await supabase
        .from('operateurs_sociaux')
        .upsert(operateur, { onConflict: 'email' });
      
      if (error) {
        console.error('Erreur lors de l\'insertion de l\'opérateur:', error);
      }
    }

    // 5. Récupérer les usagers et opérateurs insérés
    const { data: usagers } = await supabase.from('usagers').select('id');
    const { data: operateurs } = await supabase.from('operateurs_sociaux').select('id');

    // 6. Générer 10 réservations par hôtel
    console.log('📅 Génération des réservations...');
    const reservationsToInsert = [];

    for (const hotel of hotels) {
      console.log(`🏨 Génération des réservations pour ${hotel.nom}...`);
      
      // Filtrer les chambres de cet hôtel
      const hotelRooms = rooms.filter(room => room.hotel_id === hotel.id);
      
      if (hotelRooms.length === 0) {
        console.warn(`⚠️ Aucune chambre trouvée pour l'hôtel ${hotel.nom}`);
        continue;
      }

      for (let i = 0; i < 10; i++) {
        const { date_arrivee, date_depart, duree } = generateRandomDates();
        const prix = generateRandomPrice();
        const statut = generateRandomStatus();
        const prescripteur = generateRandomPrescripteur();
        
        // Sélectionner aléatoirement une chambre, un usager et un opérateur
        const randomRoom = hotelRooms[Math.floor(Math.random() * hotelRooms.length)];
        const randomUsager = usagers[Math.floor(Math.random() * usagers.length)];
        const randomOperateur = operateurs[Math.floor(Math.random() * operateurs.length)];

        const reservation = {
          usager: randomUsager.id,
          chambre_id: randomRoom.id,
          hotel_id: hotel.id,
          date_arrivee,
          date_depart,
          statut,
          prescripteur,
          prix: randomRoom.prix_nuit * duree, // Prix total pour toute la durée
          duree,
          operateur_id: randomOperateur.id,
          notes: `Réservation générée automatiquement pour ${randomUsager.nom} ${randomUsager.prenom}. ${statut === 'CONFIRMEE' ? 'Réservation confirmée.' : statut === 'EN_COURS' ? 'En attente de confirmation.' : 'Séjour terminé.'}`
        };

        reservationsToInsert.push(reservation);
      }
    }

    // 7. Insérer toutes les réservations
    console.log(`💾 Insertion de ${reservationsToInsert.length} réservations...`);
    const { data: insertedReservations, error: reservationsError } = await supabase
      .from('reservations')
      .insert(reservationsToInsert)
      .select();

    if (reservationsError) {
      console.error('Erreur lors de l\'insertion des réservations:', reservationsError);
      return;
    }

    console.log(`✅ ${insertedReservations.length} réservations insérées avec succès !`);

    // 8. Mettre à jour les statistiques des hôtels
    console.log('📊 Mise à jour des statistiques des hôtels...');
    for (const hotel of hotels) {
      const hotelReservations = insertedReservations.filter(r => r.hotel_id === hotel.id);
      const reservationsEnCours = hotelReservations.filter(r => r.statut === 'EN_COURS').length;
      const reservationsConfirmees = hotelReservations.filter(r => r.statut === 'CONFIRMEE').length;
      
      // Filtrer les chambres de cet hôtel
      const hotelRooms = rooms.filter(room => room.hotel_id === hotel.id);
      
      const { error: updateError } = await supabase
        .from('hotels')
        .update({
          chambres_occupees: reservationsEnCours + reservationsConfirmees,
          taux_occupation: ((reservationsEnCours + reservationsConfirmees) / hotelRooms.length) * 100
        })
        .eq('id', hotel.id);

      if (updateError) {
        console.error(`Erreur lors de la mise à jour de l'hôtel ${hotel.nom}:`, updateError);
      }
    }

    // 9. Afficher un résumé
    console.log('\n📈 RÉSUMÉ DE LA GÉNÉRATION :');
    console.log(`🏨 Hôtels traités: ${hotels.length}`);
    console.log(`🏠 Chambres disponibles: ${rooms.length}`);
    console.log(`👥 Usagers créés: ${usagersData.length}`);
    console.log(`🏢 Opérateurs sociaux créés: ${operateursData.length}`);
    console.log(`📅 Réservations générées: ${insertedReservations.length}`);
    
    // Statistiques par statut
    const statsByStatus = insertedReservations.reduce((acc, r) => {
      acc[r.statut] = (acc[r.statut] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Répartition par statut:');
    Object.entries(statsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} réservations`);
    });

    console.log('\n🎉 Génération des données synthétiques terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
  }
}

// Exécuter le script
generateReservationsData(); 