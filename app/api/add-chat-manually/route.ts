import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { initBot } from "@/lib/telegram"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chat_id } = body

    if (!chat_id) {
      return NextResponse.json(
        {
          success: false,
          error: "chat_id parametresi gerekli",
        },
        { status: 400 },
      )
    }

    // Botu başlat
    const bot = initBot()

    if (!bot) {
      return NextResponse.json({
        success: false,
        error: "Bot başlatılamadı",
      })
    }

    try {
      // Grup bilgilerini al
      const chatInfo = await bot.getChat(chat_id)
      console.log("Grup bilgileri alındı:", chatInfo)

      // Botun admin olup olmadığını kontrol et
      let isAdmin = false
      let memberCount = null

      try {
        // Üye sayısını al
        if (chatInfo.type !== "private") {
          const chatMemberCount = await bot.getChatMemberCount(chat_id)
          memberCount = chatMemberCount || null
        }

        // Botun bilgilerini al
        const botInfo = await bot.getMe()
        const botMember = await bot.getChatMember(chat_id, botInfo.id.toString())
        isAdmin = ["administrator", "creator"].includes(botMember.status)
      } catch (error) {
        console.error(`Grup bilgilerini alma hatası (${chat_id}):`, error)
      }

      // Grubu veritabanına ekle/güncelle
      const { data, error } = await supabaseAdmin.from("bot_chats").upsert(
        {
          chat_id: Number(chat_id),
          chat_type: chatInfo.type,
          chat_title: chatInfo.title || null,
          is_admin: isAdmin,
          member_count: memberCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "chat_id",
        },
      )

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Grup başarıyla eklendi",
        chat: {
          chat_id: Number(chat_id),
          chat_type: chatInfo.type,
          chat_title: chatInfo.title,
          is_admin: isAdmin,
          member_count: memberCount,
        },
      })
    } catch (error) {
      console.error("Grup bilgilerini alma hatası:", error)
      return NextResponse.json({
        success: false,
        error: `Grup bilgilerini alma hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
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
