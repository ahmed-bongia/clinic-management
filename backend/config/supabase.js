const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || supabaseUrl.includes('your-project') || !supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  console.warn('[WARN] Supabase is not fully configured. The server will use in-memory demo data for operations.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[INFO] Supabase client initialized successfully.');
  } catch (error) {
    console.error('[ERROR] Failed to initialize Supabase client:', error.message);
  }
}

module.exports = {
  supabase,
  isConfigured: () => !!supabase
};
