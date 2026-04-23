const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Export as db for compatibility with our service
module.exports = {
    query: async (text, params) => {
        // This is a simplified wrapper - for complex queries use supabase directly
        console.log('📝 DB Query:', text.substring(0, 100));
        
        // For SELECT queries
        if (text.trim().toUpperCase().startsWith('SELECT')) {
            const { data, error } = await supabase.rpc('execute_sql', { 
                query_text: text,
                query_params: params 
            }).catch(() => ({ data: null, error: null }));
            
            if (error) {
                // Fallback for simple queries
                return { rows: [], rowCount: 0 };
            }
            return { rows: data || [], rowCount: data?.length || 0 };
        }
        
        // For UPDATE/INSERT/DELETE
        return { rows: [], rowCount: 0 };
    },
    supabase // Export raw supabase client for direct use
};