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
    polling: true, // Webhook yerine polling kullanıyoruz
  })

  // Debug için bot bilgilerini logla
  bot
    .getMe()
    .then((botInfo) => {
      console.log("Bot bilgileri:", botInfo)
    })
    .catch((err) => {
      console.error("Bot bilgilerini alma hatası:", err)
    })

  // Yeni üye katıldığında
  bot.on("new_chat_members", async (msg) => {
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
        if (member.is_bot && member.username === bot.options.username) continue

        // Kullanıcı adını al
        const username = member.username ? `@${member.username}` : member.first_name

        // Mesajı kişiselleştir
        const personalizedMessage = announcements.message
          .replace("{username}", username)
          .replace("{first_name}", member.first_name || "")
          .replace("{last_name}", member.last_name || "")
          .replace("{chat_title}", chatTitle)

        // Mesajı gönder
        bot.sendMessage(chatId, personalizedMessage, { parse_mode: "Markdown" })
      }
    }
  })

  // Bot bir gruptan çıkarıldığında
  bot.on("left_chat_member", async (msg) => {
    // Çıkarılan üye bot ise
    if (msg.left_chat_member?.is_bot && msg.left_chat_member?.username === bot?.options.username) {
      // Grubu veritabanından sil
      await supabaseAdmin.from("bot_chats").delete().eq("chat_id", msg.chat.id)
    }
  })

  // Grup bilgileri güncellendiğinde
  bot.on("new_chat_title", async (msg) => {
    await updateBotChat(msg.chat)
  })

  // Grup fotoğrafı değiştiğinde
  bot.on("new_chat_photo", async (msg) => {
    await updateBotChat(msg.chat)
  })

  // Admin komutlarını işle
  bot.onText(/\/setmessage (.+)/, async (msg, match) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    console.log("setmessage komutu alındı. User ID:", userId)

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
        bot.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
        return
      }

      // Yeni mesajı al
      const newMessage = match?.[1]

      if (!newMessage) {
        bot.sendMessage(chatId, "Lütfen bir mesaj belirtin. Örnek: /setmessage Hoş geldiniz!")
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
        bot.sendMessage(chatId, `Hata oluştu: ${saveError.message}`)
        return
      }

      bot.sendMessage(chatId, "Duyuru mesajı başarıyla güncellendi!")
    } catch (err) {
      console.error("setmessage komut hatası:", err)
      bot.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    }
  })

  // Mevcut mesajı göster
  bot.onText(/\/showmessage/, async (msg) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    console.log("showmessage komutu alındı. User ID:", userId)

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
        bot.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
        return
      }

      // Bu sohbet için duyuru mesajını al
      const { data: announcement, error: fetchError } = await supabaseAdmin
        .from("announcements")
        .select("*")
        .eq("chat_id", chatId)
        .single()

      if (fetchError || !announcement) {
        bot.sendMessage(chatId, "Bu sohbet için henüz bir duyuru mesajı ayarlanmamış.")
        return
      }

      bot.sendMessage(chatId, `Mevcut duyuru mesajı:\n\n${announcement.message}`)
    } catch (err) {
      console.error("showmessage komut hatası:", err)
      bot.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    }
  })

  // Admin ekle
  bot.onText(/\/addadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    console.log("addadmin komutu alındı. User ID:", userId)

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
        bot.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
        return
      }

      // Eklenecek admin ID'sini al
      const newAdminId = Number.parseInt(match?.[1] || "0")

      if (!newAdminId) {
        bot.sendMessage(chatId, "Lütfen geçerli bir kullanıcı ID belirtin. Örnek: /addadmin 123456789")
        return
      }

      // Yeni admini veritabanına ekle
      const { data, error: saveError } = await supabaseAdmin.from("admin_users").insert({
        user_id: newAdminId,
        username: null,
      })

      if (saveError) {
        console.error("Admin ekleme hatası:", saveError)
        bot.sendMessage(chatId, `Hata oluştu: ${saveError.message}`)
        return
      }

      bot.sendMessage(chatId, `Kullanıcı ID ${newAdminId} başarıyla admin olarak eklendi!`)
    } catch (err) {
      console.error("addadmin komut hatası:", err)
      bot.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    }
  })

  // Grupları güncelle komutu
  bot.onText(/\/updatechats/, async (msg) => {
    const userId = msg.from?.id

    console.log("updatechats komutu alındı. User ID:", userId)

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
        bot.sendMessage(msg.chat.id, "Bu komutu kullanma yetkiniz yok!")
        return
      }

      // Botun üye olduğu tüm grupları güncelle
      await updateAllBotChats()
      bot.sendMessage(msg.chat.id, "Gruplar başarıyla güncellendi!")
    } catch (error) {
      console.error("Grupları güncelleme hatası:", error)
      bot.sendMessage(msg.chat.id, "Grupları güncellerken bir hata oluştu.")
    }
  })

  // Botun üye olduğu grupları göster
  bot.onText(/\/listchats/, async (msg) => {
    const userId = msg.from?.id

    console.log("listchats komutu alındı. User ID:", userId)

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
        bot.sendMessage(msg.chat.id, "Bu komutu kullanma yetkiniz yok!")
        return
      }

      // Botun üye olduğu grupları al
      const { data: chats, error: fetchError } = await supabaseAdmin
        .from("bot_chats")
        .select("*")
        .order("chat_title", { ascending: true })

      if (fetchError) {
        console.error("Grupları listeleme hatası:", fetchError)
        bot.sendMessage(msg.chat.id, "Grupları listelerken bir hata oluştu.")
        return
      }

      if (!chats || chats.length === 0) {
        bot.sendMessage(msg.chat.id, "Bot henüz hiçbir gruba eklenmemiş.")
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

      bot.sendMessage(msg.chat.id, message)
    } catch (err) {
      console.error("listchats komut hatası:", err)
      bot.sendMessage(msg.chat.id, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    }
  })

  // Kullanıcı ID'sini göster
  bot.onText(/\/myid/, (msg) => {
    const userId = msg.from?.id
    const username = msg.from?.username

    bot.sendMessage(msg.chat.id, `Kullanıcı ID'niz: ${userId}\nKullanıcı adınız: @${username || "yok"}`)
  })

  // Start komutu
  bot.onText(/\/start/, (msg) => {
    const userId = msg.from?.id
    const firstName = msg.from?.first_name

    const message = `Merhaba ${firstName}! 👋\n\nBen bir hoş geldin botuyum. Gruplara eklendiğimde, yeni katılan üyelere hoş geldin mesajı gönderirim.\n\nKomutlar:\n/myid - Kullanıcı ID'nizi gösterir\n/setmessage [mesaj] - Duyuru mesajını ayarlar\n/showmessage - Mevcut duyuru mesajını gösterir\n/listchats - Botun eklendiği grupları listeler\n/updatechats - Grup listesini günceller`

    bot.sendMessage(msg.chat.id, message)
  })

  console.log("Telegram bot başlatıldı!")
  return bot
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

    // Botun üye olduğu tüm grupları manuel olarak kontrol et
    try {
      if (bot) {
        const botInfo = await bot.getMe()
        console.log("Bot bilgileri:", botInfo)

        // Botun üye olduğu grupları getUpdates ile kontrol et
        const updates = await bot.getUpdates(0, 100, -1)
        console.log("Bot güncellemeleri:", updates)

        // Güncellemelerden grup bilgilerini çıkar
        const chatIds = new Set<number>()
        updates.forEach((update) => {
          if (update.message?.chat?.id && update.message.chat.type !== "private") {
            chatIds.add(update.message.chat.id)
          }
        })

        console.log("Tespit edilen grup ID'leri:", Array.from(chatIds))

        // Her grup için bilgileri güncelle
        for (const chatId of chatIds) {
          try {
            const chatInfo = await bot.getChat(chatId)
            await updateBotChat(chatInfo)
          } catch (error) {
            console.error(`Grup bilgilerini alma hatası (${chatId}):`, error)
          }
        }
      }
    } catch (error) {
      console.error("Bot güncellemelerini alma hatası:", error)
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
    bot.stopPolling()
    bot = null
    console.log("Telegram bot durduruldu!")
  }
}
