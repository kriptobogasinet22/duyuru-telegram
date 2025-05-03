import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Duyuruları yükle
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Duyurular yükleme hatası:", error)
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
