import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://cnjaqnjuwgcuoeuupvjb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamFxbmp1d2djdW9ldXVwdmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NjYwMDAsImV4cCI6MjA1NTU0MjAwMH0.yEapYMI-oMN-fLpJ98ssoB3lJ-AFE1bLsT1Tsb2Bxn8"

export const supabase = createClient(supabaseURL,supabaseAnonKey);