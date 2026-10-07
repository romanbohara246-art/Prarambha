import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseConfigured=Boolean(url&&key);
export const supabase=supabaseConfigured?createClient(url,key):null;
// Separate client used only to create logins, so the admin's own session is never replaced.
export const signupClient=supabaseConfigured?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'prarambha-signup'}}):null;
