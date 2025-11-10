import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zjahqoudwupxbbaemvuq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYWhxb3Vkd3VweGJiYWVtdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODM2OTcsImV4cCI6MjA3Njg1OTY5N30.F8HgUSTNGU26Mvo5BhqK7VfHp0dvZwY73K8Zf7H0cxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
