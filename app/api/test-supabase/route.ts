import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Ortam değişkenlerini kontrol et
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Ortam değişkenlerini kontrol et
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "✓" : "✗",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "✓" : "✗",
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "✓" : "✗",
    }

    // Eğer gerekli değişkenler eksikse
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Eksik Supabase ortam değişkenleri",
        envCheck,
      })
    }

    // Supabase bağlantısını test et
    try {
      const { data, error } = await supabaseAdmin.from("admin_users").select("count").limit(1)

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
          details: {
            code: error.code,
            hint: error.hint,
            details: error.details,
          },
          envCheck,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Supabase bağlantısı başarılı",
        data,
        envCheck,
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
        envCheck,
      })
    }
  } catch (error) {
    console.error("API hatası:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
