const supabaseConfig = window.EURBAN_SUPABASE;

window.eurbanSupabase = null;

if (window.supabase && supabaseConfig && !supabaseConfig.url.includes('TU-PROYECTO') && !supabaseConfig.anonKey.includes('TU-ANON-KEY')) {
    window.eurbanSupabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
}
