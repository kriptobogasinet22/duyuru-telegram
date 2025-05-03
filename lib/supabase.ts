import { createClient } from "@supabase/supabase-js"

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Ortam değişkenlerini kontrol et
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Eksik Supabase ortam değişkenleri:", {
    url: supabaseUrl ? "✓" : "✗",
    anonKey: supabaseAnonKey ? "✓" : "✗",
    serviceKey: supabaseServiceKey ? "✓" : "✗",
  })
}

// Anonim istemci (client-side için)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Oturum bilgilerini saklamayı devre dışı bırak
    autoRefreshToken: false, // Token yenilemeyi devre dışı bırak
  },
})

// Servis rolü istemcisi (server-side için)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // Oturum bilgilerini saklamayı devre dışı bırak
    autoRefreshToken: false, // Token yenilemeyi devre dışı bırak
  },
})

// Tip tanımlamaları
export type Announcement = {
  id: number
  chat_id: number
  chat_type: string
  chat_title: string | null
  message: string
  created_at: string
  updated_at: string
}

export type AdminUser = {
  id: number
  user_id: number
  username: string | null
  created_at: string
}

// Yeni tip tanımlaması ekle
export type BotChat = {
  id: number
  chat_id: number
  chat_type: string
  chat_title: string | null
  is_admin: boolean
  member_count: number | null
  joined_at: string
  updated_at: string
}
