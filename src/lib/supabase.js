import { createClient } from '@supabase/supabase-js'

// Vite expõe variáveis de ambiente via import.meta.env (prefixo VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Variáveis de ambiente não configuradas — usando dados locais.')
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null
