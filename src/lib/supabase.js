import { createClient } from '@supabase/supabase-js'

// Usa variáveis de ambiente (Vercel/local) ou os valores padrão do projeto
// A publishable key é pública por design — segura para estar no client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://mvtdqwedgdcxjfvhfrdp.supabase.co'

const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || 'sb_publishable_RxaOoYgcmyoLdR0UwGBjEQ_NrNTMT5I'

export const supabase = createClient(supabaseUrl, supabaseKey)
