/**
 * Manual script to create the rooms table for testing purposes
 * This creates only the essential tables needed for our CRUD test
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createRoomsTable() {
  console.log('🚀 Creating rooms table and dependencies...');

  try {
    // First, let's check if hotels table exists
    const { data: hotelCheck } = await supabase
      .from('hotels')
      .select('*')
      .limit(1);

    console.log('✅ Hotels table exists');

    // Create room_categories table first (rooms references it)
    console.log('📋 Creating room_categories table...');
    const { error: categoryError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.room_categories (
          id BIGSERIAL PRIMARY KEY,
          hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          base_price DECIMAL(10,2) NOT NULL DEFAULT 45.00,
          max_occupancy INTEGER DEFAULT 2,
          amenities JSONB DEFAULT '[]'::jsonb,
          images JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT unique_category_per_hotel UNIQUE(hotel_id, name)
        );
      `
    });

    if (categoryError) {
      console.log('⚠️ Room categories creation might have failed:', categoryError.message);
    }

    // Create rooms table
    console.log('📋 Creating rooms table...');
    const { error: roomsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.rooms (
          id BIGSERIAL PRIMARY KEY,
          hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
          numero VARCHAR(50) NOT NULL,
          type VARCHAR(50) NOT NULL,
          prix DECIMAL(10,2) NOT NULL DEFAULT 45.00,
          statut VARCHAR(20) DEFAULT 'disponible' CHECK (statut IN ('disponible', 'occupee', 'maintenance')),
          description TEXT,
          category_id BIGINT,
          floor INTEGER DEFAULT 0,
          room_size DECIMAL(8,2),
          bed_type VARCHAR(50),
          view_type VARCHAR(50),
          is_smoking BOOLEAN DEFAULT false,
          images JSONB DEFAULT '[]'::jsonb,
          amenities JSONB DEFAULT '[]'::jsonb,
          last_cleaned DATE,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT unique_room_per_hotel UNIQUE(hotel_id, numero)
        );
      `
    });

    if (roomsError) {
      console.log('❌ Rooms table creation failed:', roomsError.message);
      return false;
    }

    console.log('✅ Rooms table created successfully');

    // Create indexes
    console.log('📋 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);',
      'CREATE INDEX IF NOT EXISTS idx_rooms_statut ON public.rooms(statut);',
      'CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(type);'
    ];

    for (const indexQuery of indexes) {
      const { error } = await supabase.rpc('sql', { query: indexQuery });
      if (error) {
        console.log('⚠️ Index creation might have failed:', error.message);
      }
    }

    // Create update trigger function
    console.log('📋 Creating update trigger...');
    const { error: functionError } = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE 'plpgsql';
      `
    });

    if (functionError) {
      console.log('⚠️ Function creation might have failed:', functionError.message);
    }

    // Create trigger
    const { error: triggerError } = await supabase.rpc('sql', {
      query: `
        CREATE TRIGGER IF NOT EXISTS trigger_rooms_updated_at 
        BEFORE UPDATE ON public.rooms 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.log('⚠️ Trigger creation might have failed:', triggerError.message);
    }

    // Verify table creation
    const { data: rooms, error: verifyError } = await supabase
      .from('rooms')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('❌ Table verification failed:', verifyError.message);
      return false;
    }

    console.log('✅ Rooms table verified and ready for use!');

    // Try to create a test room to ensure everything works
    console.log('📋 Testing room creation...');
    const testRoom = {
      hotel_id: 1,
      numero: 'TEST-SETUP',
      type: 'Test Room',
      prix: 45.00,
      description: 'Test room created during setup'
    };

    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(testRoom)
      .select()
      .single();

    if (createError) {
      console.log('❌ Test room creation failed:', createError.message);
      return false;
    }

    console.log('✅ Test room created successfully:', created.numero);

    // Clean up test room
    await supabase.from('rooms').delete().eq('id', created.id);
    console.log('✅ Test room cleaned up');

    return true;

  } catch (error) {
    console.error('💥 Error during table creation:', error.message);
    return false;
  }
}

// Run the creation script
createRoomsTable()
  .then(success => {
    if (success) {
      console.log('🎉 Rooms table setup completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Rooms table setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });