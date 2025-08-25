#!/usr/bin/env node

/**
 * DIAGNOSTIC SCHEMA EQUIPEMENTS
 * Vérification de la structure réelle de la table equipments
 */

const fetch = require('node-fetch');
const fs = require('fs');

console.log('🔍 DIAGNOSTIC SCHEMA EQUIPEMENTS');
console.log('=================================\n');

// Charger la configuration
let config;
try {
  config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));
  console.log('✅ Configuration chargée');
} catch (error) {
  console.log('❌ Erreur de configuration:', error.message);
  process.exit(1);
}

async function checkTableStructure() {
  try {
    console.log('📋 VÉRIFICATION DE LA STRUCTURE DES TABLES');
    console.log('------------------------------------------');

    // Vérifier toutes les tables disponibles
    const tablesResponse = await fetch(`${config.supabase.url}/rest/v1/information_schema.tables?table_schema=eq.public&select=table_name`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key
      }
    });

    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log('✅ Tables disponibles dans le schéma public:');
      tables.forEach(table => {
        console.log(`  • ${table.table_name}`);
      });
      
      const equipmentTables = tables.filter(t => 
        t.table_name.includes('equipment') || 
        t.table_name.includes('equipement')
      );
      
      if (equipmentTables.length > 0) {
        console.log('\n🎯 Tables liées aux équipements trouvées:');
        equipmentTables.forEach(table => {
          console.log(`  • ${table.table_name}`);
        });
      } else {
        console.log('\n❌ Aucune table d\'équipements trouvée !');
      }
    } else {
      console.log('❌ Erreur récupération tables:', await tablesResponse.text());
    }

    // Vérifier les colonnes de la table equipments si elle existe
    console.log('\n📊 STRUCTURE DE LA TABLE equipments');
    console.log('-----------------------------------');
    
    const columnsResponse = await fetch(`${config.supabase.url}/rest/v1/information_schema.columns?table_name=eq.equipments&table_schema=eq.public&select=column_name,data_type,is_nullable`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key
      }
    });

    if (columnsResponse.ok) {
      const columns = await columnsResponse.json();
      if (columns.length > 0) {
        console.log('✅ Colonnes de la table equipments:');
        columns.forEach(col => {
          console.log(`  • ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('❌ Table equipments introuvable ou sans colonnes');
      }
    } else {
      console.log('❌ Erreur récupération colonnes:', await columnsResponse.text());
    }

    // Essayer d'accéder directement à la table equipments
    console.log('\n🧪 TEST D\'ACCÈS DIRECT');
    console.log('----------------------');
    
    const directResponse = await fetch(`${config.supabase.url}/rest/v1/equipments?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key
      }
    });

    console.log(`Status: ${directResponse.status}`);
    const directText = await directResponse.text();
    console.log(`Response: ${directText}`);

    if (directResponse.status === 200) {
      try {
        const data = JSON.parse(directText);
        if (data.length > 0) {
          console.log('✅ Exemple d\'enregistrement:');
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log('✅ Table accessible mais vide');
        }
      } catch (e) {
        console.log('⚠️  Réponse non-JSON:', directText);
      }
    }

  } catch (error) {
    console.log('❌ Erreur diagnostic:', error.message);
  }
}

// Créer des instructions pour créer la table si elle n'existe pas
function generateCreateTableSQL() {
  console.log('\n📝 SQL POUR CRÉER LA TABLE EQUIPMENTS');
  console.log('=====================================');
  
  const createSQL = `-- Création de la table equipments
CREATE TABLE IF NOT EXISTS public.equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table de liaison hotel_equipments
CREATE TABLE IF NOT EXISTS public.hotel_equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  quantite INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id, equipment_id)
);

-- Politiques RLS ultra-permissives
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ultra_permissive_policy" ON public.equipments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.hotel_equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ultra_permissive_policy" ON public.hotel_equipments FOR ALL USING (true) WITH CHECK (true);

-- Données de test
INSERT INTO public.equipments (nom, description, type) VALUES 
('Wi-Fi', 'Accès Internet sans fil', 'CONNECTIVITE'),
('Parking', 'Place de parking', 'TRANSPORT'),
('Climatisation', 'Climatisation dans les chambres', 'CONFORT'),
('Télévision', 'Télévision dans les chambres', 'DIVERTISSEMENT'),
('Ascenseur', 'Accès facilité aux étages', 'ACCESSIBILITE')
ON CONFLICT DO NOTHING;`;

  console.log(createSQL);
  return createSQL;
}

async function main() {
  await checkTableStructure();
  const createSQL = generateCreateTableSQL();
  
  console.log('\n🎯 RÉSUMÉ ET ACTIONS');
  console.log('===================');
  console.log('1. Vérifiez si la table equipments existe dans le diagnostic ci-dessus');
  console.log('2. Si elle n\'existe pas, utilisez le SQL fourni pour la créer');
  console.log('3. Si elle existe mais avec d\'autres colonnes, adaptez votre code');
  console.log('4. Les politiques RLS ultra-permissives sont incluses dans le SQL');
}

main().catch(console.error);