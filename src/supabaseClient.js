import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hxptnnqmmroizubvhozo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cHRubnFtbXJvaXp1YnZob3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NDU0MjEsImV4cCI6MjA2NjQyMTQyMX0.GFVQAMHjZR3bNhiNtUm9aNmTj6awHwOFBT7f7MMbRyw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);