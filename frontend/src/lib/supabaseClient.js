// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pyzjcigibjheuugvpbwx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5empjaWdpYmpoZXV1Z3ZwYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODg0ODksImV4cCI6MjA5MTA2NDQ4OX0.6yhN7s9A4S-IuuFB6JnfVgzvh_0Bqt48UVfIcm2yNBM'

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

// 🔥 ADD THIS FOR CONSOLE TESTING
if (typeof window !== "undefined") {
    window.supabase = supabase
}