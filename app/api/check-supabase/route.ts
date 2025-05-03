import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Basit bir sorgu ile Supabase bağlantısını test et
    const { data, error } = await supabaseAdmin.from("admin_users").select("count").limit(1)

    if (error) {
      console.error("Supabase bağlantı hatası:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase bağlantısı başarılı",
      data,
    })
  } catch (error) {
    console.error("Supabase kontrol hatası:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
