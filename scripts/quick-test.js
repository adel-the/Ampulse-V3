const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function quickTest() {
  try {
    console.log('Testing supabaseAdmin connection...');
    
    const { data, error } = await supabaseAdmin
      .from('maintenance_tasks')
      .insert({
        titre: 'Quick Test ' + Date.now(),
        description: 'Test rapide RLS fix',
        priorite: 'moyenne',
        statut: 'en_attente',
        room_id: 1,
        hotel_id: 1,
        user_owner_id: '46e58630-4ae0-4682-aa24-a4be2fb6e866',
        created_by: '46e58630-4ae0-4682-aa24-a4be2fb6e866'
      })
      .select('id, titre')
      .single();

    if (error) {
      console.log('ERROR:', error.message);
    } else {
      console.log('SUCCESS! Task created:', data);
      
      // Clean up
      await supabaseAdmin.from('maintenance_tasks').delete().eq('id', data.id);
      console.log('Test task deleted');
    }
  } catch (e) {
    console.log('EXCEPTION:', e.message);
  }
}

quickTest();