import { NextResponse } from "next/server"
import { initBot } from "@/lib/telegram"
import { supabaseAdmin } from "@/lib/supabase"

// Grupları yenileme işlemi
export async function GET() {
  try {
    // Botu başlat
    const bot = initBot()

    if (!bot) {
      return NextResponse.json({
        success: false,
        error: "Bot başlatılamadı",
      })
    }

    // Botun üye olduğu tüm grupları güncelle
    try {
      // Veritabanındaki tüm grupları al
      const { data: chats, error: fetchError } = await supabaseAdmin.from("bot_chats").select("chat_id")

      if (fetchError) {
        return NextResponse.json({
          success: false,
          error: `Grupları alma hatası: ${fetchError.message}`,
        })
      }

      console.log("Veritabanındaki gruplar:", chats)

      if (chats && chats.length > 0) {
        // Her grup için bilgileri güncelle
        for (const chat of chats) {
          try {
            console.log("Grup güncelleniyor:", chat.chat_id)
            const chatInfo = await bot.getChat(chat.chat_id)

            if (chatInfo) {
              // Botun admin olup olmadığını kontrol et
              let isAdmin = false
              let memberCount = null

              try {
                // Üye sayısını al
                if (chatInfo.type !== "private") {
                  const chatMemberCount = await bot.getChatMemberCount(chat.chat_id)
                  memberCount = chatMemberCount || null
                }

                // Botun bilgilerini al
                const botInfo = await bot.getMe()
                const botMember = await bot.getChatMember(chat.chat_id, botInfo.id.toString())
                isAdmin = ["administrator", "creator"].includes(botMember.status)
              } catch (error) {
                console.error(`Grup bilgilerini alma hatası (${chat.chat_id}):`, error)
              }

              // Grubu veritabanına güncelle
              await supabaseAdmin.from("bot_chats").upsert(
                {
                  chat_id: chat.chat_id,
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
            }
          } catch (error) {
            console.error(`Grup bilgilerini alma hatası (${chat.chat_id}):`, error)
            // Eğer bot gruptan çıkarıldıysa, veritabanından sil
            if (
              error.message &&
              (error.message.includes("chat not found") || error.message.includes("bot was kicked"))
            ) {
              await supabaseAdmin.from("bot_chats").delete().eq("chat_id", chat.chat_id)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Gruplar yenileniyor",
        groupCount: chats?.length || 0,
      })
    } catch (error) {
      console.error("Grupları yenileme hatası:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Grupları yenilerken bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API hatası:", error)
    return NextResponse.json(
      {
        success: false,
        error: `API hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      },
      { status: 500 },
    )
  }
}
