const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestEquipment() {
  try {
    console.log('Creating test equipment for hotels...');

    // First, get the list of hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom')
      .limit(3);

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError);
      return;
    }

    if (!hotels || hotels.length === 0) {
      console.log('No hotels found. Please create hotels first.');
      return;
    }

    console.log(`Found ${hotels.length} hotels`);

    // Equipment data for each hotel
    const equipmentData = [
      // Connectivity
      { nom: 'WiFi Gratuit', description: 'Internet haute vitesse dans tout l\'établissement', categorie: 'connectivity', icone: 'wifi', est_premium: false, est_actif: true, ordre_affichage: 1 },
      { nom: 'WiFi Premium', description: 'Internet très haute vitesse avec priorité', categorie: 'connectivity', icone: 'wifi', est_premium: true, est_actif: true, ordre_affichage: 2 },
      
      // Multimedia
      { nom: 'Télévision HD', description: 'Télévision haute définition avec chaînes TNT', categorie: 'multimedia', icone: 'tv', est_premium: false, est_actif: true, ordre_affichage: 3 },
      { nom: 'Netflix & Streaming', description: 'Accès aux plateformes de streaming', categorie: 'multimedia', icone: 'tv', est_premium: true, est_actif: true, ordre_affichage: 4 },
      
      // Comfort
      { nom: 'Climatisation', description: 'Climatisation réversible chaud/froid', categorie: 'comfort', icone: 'thermometer', est_premium: false, est_actif: true, ordre_affichage: 5 },
      { nom: 'Mini-bar', description: 'Mini-bar avec sélection de boissons', categorie: 'comfort', icone: 'coffee', est_premium: true, est_actif: true, ordre_affichage: 6 },
      { nom: 'Coffre-fort', description: 'Coffre-fort sécurisé dans la chambre', categorie: 'comfort', icone: 'shield', est_premium: false, est_actif: true, ordre_affichage: 7 },
      
      // Services
      { nom: 'Petit-déjeuner inclus', description: 'Petit-déjeuner continental servi de 7h à 10h', categorie: 'services', icone: 'coffee', est_premium: false, est_actif: true, ordre_affichage: 8 },
      { nom: 'Service en chambre', description: 'Room service disponible 24h/24', categorie: 'services', icone: 'utensils', est_premium: true, est_actif: true, ordre_affichage: 9 },
      { nom: 'Parking gratuit', description: 'Place de parking privée gratuite', categorie: 'services', icone: 'car', est_premium: false, est_actif: true, ordre_affichage: 10 },
      
      // Security
      { nom: 'Surveillance 24h/24', description: 'Surveillance vidéo et personnel de sécurité', categorie: 'security', icone: 'shield', est_premium: false, est_actif: true, ordre_affichage: 11 },
      { nom: 'Détecteur de fumée', description: 'Détecteurs de fumée dans toutes les chambres', categorie: 'security', icone: 'shield', est_premium: false, est_actif: true, ordre_affichage: 12 },
      
      // Wellness
      { nom: 'Salle de sport', description: 'Accès gratuit à la salle de sport', categorie: 'wellness', icone: 'dumbbell', est_premium: false, est_actif: true, ordre_affichage: 13 },
      { nom: 'Spa & Massage', description: 'Accès au spa et services de massage', categorie: 'wellness', icone: 'spa', est_premium: true, est_actif: true, ordre_affichage: 14 },
      
      // Accessibility
      { nom: 'Accès PMR', description: 'Chambre adaptée aux personnes à mobilité réduite', categorie: 'accessibility', icone: 'users', est_premium: false, est_actif: true, ordre_affichage: 15 },
      { nom: 'Ascenseur', description: 'Ascenseur disponible pour tous les étages', categorie: 'accessibility', icone: 'users', est_premium: false, est_actif: true, ordre_affichage: 16 }
    ];

    // Create equipment for each hotel
    for (const hotel of hotels) {
      console.log(`\nCreating equipment for hotel: ${hotel.nom} (ID: ${hotel.id})`);
      
      // First check if equipment already exists for this hotel
      const { data: existingEquipment, error: checkError } = await supabase
        .from('hotel_equipment')
        .select('id')
        .eq('hotel_id', hotel.id)
        .limit(1);

      if (checkError) {
        console.error(`Error checking existing equipment for hotel ${hotel.id}:`, checkError);
        continue;
      }

      if (existingEquipment && existingEquipment.length > 0) {
        console.log(`Equipment already exists for hotel ${hotel.id}, skipping...`);
        continue;
      }

      // Add hotel_id to each equipment
      const hotelEquipment = equipmentData.map(eq => ({
        ...eq,
        hotel_id: hotel.id
      }));

      const { data, error } = await supabase
        .from('hotel_equipment')
        .insert(hotelEquipment)
        .select();

      if (error) {
        console.error(`Error creating equipment for hotel ${hotel.id}:`, error);
      } else {
        console.log(`✅ Created ${data.length} equipment items for hotel ${hotel.nom}`);
      }
    }

    // Verify creation
    const { data: allEquipment, error: verifyError } = await supabase
      .from('hotel_equipment')
      .select('hotel_id, nom, categorie, est_premium, est_actif')
      .order('hotel_id', { ascending: true })
      .order('ordre_affichage', { ascending: true });

    if (verifyError) {
      console.error('Error verifying equipment:', verifyError);
    } else {
      console.log(`\n✅ Total equipment created: ${allEquipment.length}`);
      
      // Group by hotel for summary
      const byHotel = allEquipment.reduce((acc, eq) => {
        if (!acc[eq.hotel_id]) acc[eq.hotel_id] = [];
        acc[eq.hotel_id].push(eq);
        return acc;
      }, {});

      console.log('\nEquipment summary by hotel:');
      for (const [hotelId, items] of Object.entries(byHotel)) {
        const hotel = hotels.find(h => h.id === parseInt(hotelId));
        console.log(`- ${hotel ? hotel.nom : `Hotel ${hotelId}`}: ${items.length} equipment items`);
      }
    }

  } catch (error) {
    console.error('Error in createTestEquipment:', error);
  }
}

createTestEquipment();