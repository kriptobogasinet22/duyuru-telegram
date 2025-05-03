import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Admin kullanıcılarını yükle
    const { data, error } = await supabaseAdmin.from("admin_users").select("*")

    if (error) {
      console.error("Admin kullanıcıları yükleme hatası:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
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
