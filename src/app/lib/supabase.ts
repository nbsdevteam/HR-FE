import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wyikrirzvizypnwvossn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aWtyaXJ6dml6eXBud3Zvc3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjcwNzEsImV4cCI6MjA3NzQwMzA3MX0.1PJY2NL-nqJtgNxY415t95tUONHloIZyFql11AI2-6I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
