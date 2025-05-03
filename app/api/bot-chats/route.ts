import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Bot grupları yükleniyor...")

    // Bot gruplarını yükle
    const { data, error } = await supabaseAdmin.from("bot_chats").select("*").order("chat_title", { ascending: true })

    if (error) {
      console.error("Bot grupları yükleme hatası:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    console.log(`${data?.length || 0} adet bot grubu yüklendi`)

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
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
