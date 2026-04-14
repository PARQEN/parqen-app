// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials - get these from your Supabase project settings
// Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);