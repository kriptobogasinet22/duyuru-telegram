import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Bot gruplarını yükle
    const { data, error } = await supabaseAdmin.from("bot_chats").select("*").order("chat_title", { ascending: true })

    if (error) {
      console.error("Bot grupları yükleme hatası:", error)
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
