import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Bot grupları yükleniyor...")

    // Daha detaylı log ekleyelim
    const { data: allChats, error: countError } = await supabaseAdmin.from("bot_chats").select("*")
    console.log(`Veritabanında toplam ${allChats?.length || 0} adet bot grubu var`)

    // Tüm bot gruplarını yükle - herhangi bir filtreleme olmadan
    const { data, error } = await supabaseAdmin.from("bot_chats").select("*").order("updated_at", { ascending: false }) // En son güncellenenler önce gelsin

    if (error) {
      console.error("Bot grupları yükleme hatası:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    // Her bir grup için detaylı log
    if (data && data.length > 0) {
      data.forEach((chat) => {
        console.log(
          `Grup: ${chat.chat_id}, Başlık: ${chat.chat_title}, Tür: ${chat.chat_type}, Admin: ${chat.is_admin}`,
        )
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
