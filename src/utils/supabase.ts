import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkwglwpkgebuoarixrit.supabase.co';
const supabaseKey = 'sb_publishable_cEJ27J8CR4qWSaTpcVPjRQ_oP5VTXcV';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
