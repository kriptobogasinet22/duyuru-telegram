import TelegramBot from "node-telegram-bot-api"
import { supabaseAdmin } from "./supabase"

// Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN!

// Bot örneği oluştur
let bot: TelegramBot | null = null

// Bot başlatma fonksiyonu
export function initBot() {
  if (bot) return bot

  // Webhook modunda çalışacak şekilde botu başlat
  bot = new TelegramBot(token, {
    polling: false, // Webhook modu için false
  })

  console.log("Telegram bot başlatıldı! Webhook modunda çalışıyor.")
  return bot
}

// Webhook işleme fonksiyonu
export async function processUpdate(update: any) {
  try {
    if (!bot) {
      initBot()
    }

    console.log("Webhook update işleniyor:", JSON.stringify(update))

    // Yeni üye katılma olayını kontrol et
    if (update.message?.new_chat_members) {
      await handleNewChatMembers(update.message)
    }

    // Komutları kontrol et
    if (update.message?.text) {
      await handleCommands(update.message)
    }

    return true
  } catch (error) {
    console.error("Update işleme hatası:", error)
    throw error
  }
}

// Yeni üye katılma olayını işle
async function handleNewChatMembers(msg: TelegramBot.Message) {
  try {
    console.log("Yeni üye katıldı:", JSON.stringify(msg))

    const chatId = msg.chat.id
    const chatType = msg.chat.type
    const chatTitle = msg.chat.title || ""

    // Yeni katılan kullanıcılar
    const newMembers = msg.new_chat_members || []

    // Bot kendisi gruba eklendiyse, grubu veritabanına kaydet
    const botUser = newMembers.find((member) => member.is_bot && member.username === bot?.options.username)
    if (botUser) {
      console.log("Bot gruba eklendi, veritabanına kaydediliyor:", chatId, chatTitle)
      await updateBotChat(msg.chat)
    }

    // Bu sohbet için duyuru mesajını al
    const { data: announcements } = await supabaseAdmin.from("announcements").select("*").eq("chat_id", chatId).single()

    // Eğer duyuru mesajı varsa, her yeni üyeye gönder
    if (announcements) {
      for (const member of newMembers) {
        // Bot kendisi ise atla
        if (member.is_bot && member.username === bot?.options.username) continue

        // Kullanıcı adını al
        const username = member.username ? `@${member.username}` : member.first_name

        // Mesajı kişiselleştir
        const personalizedMessage = announcements.message
          .replace("{username}", username)
          .replace("{first_name}", member.first_name || "")
          .replace("{last_name}", member.last_name || "")
          .replace("{chat_title}", chatTitle)

        // Mesajı gönder
        bot?.sendMessage(chatId, personalizedMessage, { parse_mode: "Markdown" })
      }
    }
  } catch (error) {
    console.error("Yeni üye işleme hatası:", error)
  }
}

// Komutları işle
async function handleCommands(msg: TelegramBot.Message) {
  try {
    const chatId = msg.chat.id
    const userId = msg.from?.id
    const text = msg.text || ""

    console.log("Komut alındı:", text, "User ID:", userId)

    // Start komutu
    if (text === "/start") {
      const firstName = msg.from?.first_name
      const message = `Merhaba ${firstName}! 👋\n\nBen bir hoş geldin botuyum. Gruplara eklendiğimde, yeni katılan üyelere hoş geldin mesajı gönderirim.\n\nKomutlar:\n/myid - Kullanıcı ID'nizi gösterir\n/setmessage [mesaj] - Duyuru mesajını ayarlar\n/showmessage - Mevcut duyuru mesajını gösterir\n/listchats - Botun eklendiği grupları listeler\n/updatechats - Grup listesini günceller`
      await bot?.sendMessage(chatId, message)
      return
    }

    // MyID komutu
    if (text === "/myid") {
      const username = msg.from?.username
      await bot?.sendMessage(chatId, `Kullanıcı ID'niz: ${userId}\nKullanıcı adınız: @${username || "yok"}`)
      return
    }

    // SetMessage komutu
    if (text.startsWith("/setmessage ")) {
      const newMessage = text.substring(12) // "/setmessage " uzunluğu 12

      try {
        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminUser, error } = await supabaseAdmin
          .from("admin_users")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("Admin kontrolü sonucu:", { adminUser, error })

        if (error || !adminUser) {
          console.log("Admin değil, yetki hatası")
          await bot?.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
          return
        }

        if (!newMessage) {
          await bot?.sendMessage(chatId, "Lütfen bir mesaj belirtin. Örnek: /setmessage Hoş geldiniz!")
          return
        }

        // Mesajı veritabanına kaydet
        const { data, error: saveError } = await supabaseAdmin.from("announcements").upsert(
          {
            chat_id: chatId,
            chat_type: msg.chat.type,
            chat_title: msg.chat.title || null,
            message: newMessage,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "chat_id",
          },
        )

        if (saveError) {
          console.error("Duyuru kaydetme hatası:", saveError)
          await bot?.sendMessage(chatId, `Hata oluştu: ${saveError.message}`)
          return
        }

        await bot?.sendMessage(chatId, "Duyuru mesajı başarıyla güncellendi!")
      } catch (err) {
        console.error("setmessage komut hatası:", err)
        await bot?.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      }
      return
    }

    // ShowMessage komutu
    if (text === "/showmessage") {
      try {
        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminUser, error } = await supabaseAdmin
          .from("admin_users")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("Admin kontrolü sonucu:", { adminUser, error })

        if (error || !adminUser) {
          console.log("Admin değil, yetki hatası")
          await bot?.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
          return
        }

        // Bu sohbet için duyuru mesajını al
        const { data: announcement, error: fetchError } = await supabaseAdmin
          .from("announcements")
          .select("*")
          .eq("chat_id", chatId)
          .single()

        if (fetchError || !announcement) {
          await bot?.sendMessage(chatId, "Bu sohbet için henüz bir duyuru mesajı ayarlanmamış.")
          return
        }

        await bot?.sendMessage(chatId, `Mevcut duyuru mesajı:\n\n${announcement.message}`)
      } catch (err) {
        console.error("showmessage komut hatası:", err)
        await bot?.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      }
      return
    }

    // AddAdmin komutu
    if (text.match(/^\/addadmin \d+$/)) {
      const newAdminId = Number.parseInt(text.split(" ")[1])

      try {
        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminUser, error } = await supabaseAdmin
          .from("admin_users")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("Admin kontrolü sonucu:", { adminUser, error })

        if (error || !adminUser) {
          console.log("Admin değil, yetki hatası")
          await bot?.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
          return
        }

        if (!newAdminId) {
          await bot?.sendMessage(chatId, "Lütfen geçerli bir kullanıcı ID belirtin. Örnek: /addadmin 123456789")
          return
        }

        // Yeni admini veritabanına ekle
        const { data, error: saveError } = await supabaseAdmin.from("admin_users").insert({
          user_id: newAdminId,
          username: null,
        })

        if (saveError) {
          console.error("Admin ekleme hatası:", saveError)
          await bot?.sendMessage(chatId, `Hata oluştu: ${saveError.message}`)
          return
        }

        await bot?.sendMessage(chatId, `Kullanıcı ID ${newAdminId} başarıyla admin olarak eklendi!`)
      } catch (err) {
        console.error("addadmin komut hatası:", err)
        await bot?.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      }
      return
    }

    // UpdateChats komutu
    if (text === "/updatechats") {
      try {
        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminUser, error } = await supabaseAdmin
          .from("admin_users")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("Admin kontrolü sonucu:", { adminUser, error })

        if (error || !adminUser) {
          console.log("Admin değil, yetki hatası")
          await bot?.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
          return
        }

        // Botun üye olduğu tüm grupları güncelle
        await updateAllBotChats()
        await bot?.sendMessage(chatId, "Gruplar başarıyla güncellendi!")
      } catch (error) {
        console.error("Grupları güncelleme hatası:", error)
        await bot?.sendMessage(chatId, "Grupları güncellerken bir hata oluştu.")
      }
      return
    }

    // ListChats komutu
    if (text === "/listchats") {
      try {
        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminUser, error } = await supabaseAdmin
          .from("admin_users")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("Admin kontrolü sonucu:", { adminUser, error })

        if (error || !adminUser) {
          console.log("Admin değil, yetki hatası")
          await bot?.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
          return
        }

        // Botun üye olduğu grupları al
        const { data: chats, error: fetchError } = await supabaseAdmin
          .from("bot_chats")
          .select("*")
          .order("chat_title", { ascending: true })

        if (fetchError) {
          console.error("Grupları listeleme hatası:", fetchError)
          await bot?.sendMessage(chatId, "Grupları listelerken bir hata oluştu.")
          return
        }

        if (!chats || chats.length === 0) {
          await bot?.sendMessage(chatId, "Bot henüz hiçbir gruba eklenmemiş.")
          return
        }

        // Grup listesini oluştur
        let message = "Bot aşağıdaki gruplara eklenmiş:\n\n"
        chats.forEach((chat, index) => {
          message += `${index + 1}. ${chat.chat_title || "İsimsiz"} (${chat.chat_id})\n`
          message += `   Tür: ${chat.chat_type}, Admin: ${chat.is_admin ? "Evet" : "Hayır"}\n`
          if (chat.member_count) message += `   Üye sayısı: ${chat.member_count}\n`
          message += "\n"
        })

        await bot?.sendMessage(chatId, message)
      } catch (err) {
        console.error("listchats komut hatası:", err)
        await bot?.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      }
      return
    }
  } catch (error) {
    console.error("Komut işleme hatası:", error)
  }
}

// Grup bilgilerini güncelle
async function updateBotChat(chat: TelegramBot.Chat) {
  try {
    console.log("updateBotChat çağrıldı:", chat.id, chat.title)

    // Botun admin olup olmadığını kontrol et
    let isAdmin = false
    let memberCount = null

    try {
      // Grup bilgilerini al
      const chatInfo = await bot?.getChat(chat.id)
      console.log("Grup bilgileri alındı:", chatInfo)

      // Üye sayısını al
      if (chat.type !== "private") {
        const chatMemberCount = await bot?.getChatMemberCount(chat.id)
        memberCount = chatMemberCount || null
        console.log("Üye sayısı:", memberCount)
      }

      // Botun bilgilerini al
      if (bot) {
        const botInfo = await bot.getMe()
        const botMember = await bot.getChatMember(chat.id, botInfo.id.toString())
        isAdmin = ["administrator", "creator"].includes(botMember.status)
        console.log("Bot admin mi:", isAdmin, "Status:", botMember.status)
      }
    } catch (error) {
      console.error(`Grup bilgilerini alma hatası (${chat.id}):`, error)
    }

    // Grubu veritabanına kaydet/güncelle
    const { data, error } = await supabaseAdmin.from("bot_chats").upsert(
      {
        chat_id: chat.id,
        chat_type: chat.type,
        chat_title: chat.title || null,
        is_admin: isAdmin,
        member_count: memberCount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "chat_id",
      },
    )

    if (error) {
      console.error(`Grup güncelleme hatası (${chat.id}):`, error)
    } else {
      console.log(`Grup başarıyla güncellendi (${chat.id}):`, data)
    }
  } catch (error) {
    console.error(`Grup güncelleme hatası (${chat.id}):`, error)
  }
}

// Tüm grupları güncelle
async function updateAllBotChats() {
  try {
    console.log("updateAllBotChats çağrıldı")

    // Veritabanındaki tüm grupları al
    const { data: chats, error: fetchError } = await supabaseAdmin.from("bot_chats").select("chat_id")

    if (fetchError) {
      console.error("Grupları alma hatası:", fetchError)
      throw fetchError
    }

    console.log("Veritabanındaki gruplar:", chats)

    if (chats && chats.length > 0) {
      // Her grup için bilgileri güncelle
      for (const chat of chats) {
        try {
          console.log("Grup güncelleniyor:", chat.chat_id)
          const chatInfo = await bot?.getChat(chat.chat_id)
          if (chatInfo) {
            await updateBotChat(chatInfo)
          }
        } catch (error) {
          console.error(`Grup bilgilerini alma hatası (${chat.chat_id}):`, error)
          // Eğer bot gruptan çıkarıldıysa, veritabanından sil
          if (error.message && (error.message.includes("chat not found") || error.message.includes("bot was kicked"))) {
            await supabaseAdmin.from("bot_chats").delete().eq("chat_id", chat.chat_id)
            console.log(`Grup silindi (${chat.chat_id}): Bot gruptan çıkarılmış`)
          }
        }
      }
    } else {
      console.log("Veritabanında hiç grup yok")
    }

    return true
  } catch (error) {
    console.error("Tüm grupları güncelleme hatası:", error)
    throw error
  }
}

// Botu durdur
export function stopBot() {
  if (bot) {
    bot = null
    console.log("Telegram bot durduruldu!")
  }
}
