import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables:', {
        REACT_APP_SUPABASE_URL: !!process.env.REACT_APP_SUPABASE_URL,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        REACT_APP_SUPABASE_ANON_KEY: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_KEY: !!process.env.SUPABASE_KEY,
    });
    throw new Error('❌ Missing Supabase environment variables. Check your .env file and restart the server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

if (typeof window !== 'undefined') {
    window.supabase = supabase;
}