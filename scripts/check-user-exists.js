#!/usr/bin/env node

/**
 * Script to check if a specific user ID exists in the Supabase database
 * Usage: node scripts/check-user-exists.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration using local Supabase instance
const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create admin client with service role permissions to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// User ID to check
const TARGET_USER_ID = 'c8c827c4-419f-409c-a696-e6bf0856984b';

async function checkUserExists() {
  try {
    console.log('🔍 Checking for user with ID:', TARGET_USER_ID);
    console.log('📡 Connecting to Supabase at:', supabaseUrl);
    console.log('');

    // Step 0: First check what tables exist in the database
    console.log('🔍 Exploring database structure...');
    
    // Try to get basic info about the database by attempting common table names
    const commonTables = ['usagers', 'hotels', 'rooms', 'reservations'];
    console.log('📋 Checking which tables exist:');
    
    for (const table of commonTables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`  ✅ ${table} exists (${count} records)`);
        } else {
          console.log(`  ❌ ${table} not found - ${error.message}`);
        }
      } catch (e) {
        console.log(`  ❌ ${table} not accessible - ${e.message}`);
      }
    }
    
    // Check auth users directly
    console.log('');
    console.log('🔍 Checking auth.users directly...');
    
    try {
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authUsersError) {
        console.log('❌ Error fetching auth users:', authUsersError.message);
      } else if (authUsers && authUsers.users) {
        console.log(`  ✅ auth.users accessible (${authUsers.users.length} records)`);
        
        // Check if our target user exists in auth
        const targetAuthUser = authUsers.users.find(user => user.id === TARGET_USER_ID);
        if (targetAuthUser) {
          console.log(`  🎯 Found target user in auth: ${targetAuthUser.email}`);
        } else {
          console.log(`  ❌ Target user ${TARGET_USER_ID} not found in auth.users`);
        }
      }
    } catch (authErr) {
      console.log('❌ Error checking auth.users:', authErr.message);
    }
    
    console.log('');

    // Step 1: Show a comprehensive report about users
    console.log('📊 User Analysis Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Try to get all auth users
    try {
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authUsersError) {
        console.log('❌ Error fetching auth users:', authUsersError.message);
      } else if (authUsers && authUsers.users && authUsers.users.length > 0) {
        console.log(`📈 Total users in auth.users: ${authUsers.users.length}`);
        
        // Check if our target user exists
        const targetUser = authUsers.users.find(user => user.id === TARGET_USER_ID);
        
        if (targetUser) {
          console.log('');
          console.log('🎯 TARGET USER FOUND IN AUTH.USERS!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📋 User details:');
          console.log('   ID:', targetUser.id);
          console.log('   Email:', targetUser.email);
          console.log('   Created:', targetUser.created_at);
          console.log('   Updated:', targetUser.updated_at);
          console.log('   Last sign in:', targetUser.last_sign_in_at || 'Never');
          console.log('   Email confirmed:', targetUser.email_confirmed_at ? 'Yes' : 'No');
          console.log('   Phone:', targetUser.phone || 'Not set');
          console.log('   Role:', targetUser.role || 'authenticated');
          console.log('   User metadata:', JSON.stringify(targetUser.user_metadata, null, 2));
          console.log('   App metadata:', JSON.stringify(targetUser.app_metadata, null, 2));
        } else {
          console.log('');
          console.log('❌ TARGET USER NOT FOUND');
          console.log(`   The user ID ${TARGET_USER_ID} does not exist in auth.users`);
        }
        
        console.log('');
        console.log('👥 All users in the database:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        authUsers.users.forEach((user, index) => {
          const isTarget = user.id === TARGET_USER_ID;
          const prefix = isTarget ? '🎯' : `${index + 1}.`;
          
          console.log(`${prefix} ${user.email || 'No email'}`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Created: ${user.created_at}`);
          console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
          console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
          
          if (isTarget) {
            console.log('   *** THIS IS THE TARGET USER ***');
          }
          
          console.log('   ─────────────────────────────────────────────────────');
        });
      } else {
        console.log('📭 No users found in auth.users');
      }
    } catch (authErr) {
      console.log('❌ Error accessing auth users:', authErr.message);
    }

    // Step 3: Check database connection and table structure
    console.log('');
    console.log('🔧 Database connection and table information:');
    
    // Get table info
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'users' })
      .single();

    if (tableError) {
      console.log('ℹ️  Could not get detailed table info, but connection appears to be working');
    }

    // Test basic query to ensure we can connect
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error connecting to database:', countError);
    } else {
      console.log(`✅ Successfully connected to database. Total users count: ${count}`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkUserExists().then(() => {
  console.log('');
  console.log('🏁 User existence check complete');
});