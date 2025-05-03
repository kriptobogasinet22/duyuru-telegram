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
  bot = new TelegramBot(token, { polling: false })

  // Yeni üye katıldığında
  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id
    const chatType = msg.chat.type
    const chatTitle = msg.chat.title || ""

    // Yeni katılan kullanıcılar
    const newMembers = msg.new_chat_members || []

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

  // Admin komutlarını işle
  bot.onText(/\/setmessage (.+)/, async (msg, match) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    // Kullanıcının admin olup olmadığını kontrol et
    const { data: adminUser } = await supabaseAdmin.from("admin_users").select("*").eq("user_id", userId).single()

    if (!adminUser) {
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
    const { data, error } = await supabaseAdmin.from("announcements").upsert(
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

    if (error) {
      bot.sendMessage(chatId, `Hata oluştu: ${error.message}`)
      return
    }

    bot.sendMessage(chatId, "Duyuru mesajı başarıyla güncellendi!")
  })

  // Mevcut mesajı göster
  bot.onText(/\/showmessage/, async (msg) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    // Kullanıcının admin olup olmadığını kontrol et
    const { data: adminUser } = await supabaseAdmin.from("admin_users").select("*").eq("user_id", userId).single()

    if (!adminUser) {
      bot.sendMessage(chatId, "Bu komutu kullanma yetkiniz yok!")
      return
    }

    // Bu sohbet için duyuru mesajını al
    const { data: announcement } = await supabaseAdmin.from("announcements").select("*").eq("chat_id", chatId).single()

    if (!announcement) {
      bot.sendMessage(chatId, "Bu sohbet için henüz bir duyuru mesajı ayarlanmamış.")
      return
    }

    bot.sendMessage(chatId, `Mevcut duyuru mesajı:\n\n${announcement.message}`)
  })

  // Admin ekle
  bot.onText(/\/addadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    // Kullanıcının admin olup olmadığını kontrol et
    const { data: adminUser } = await supabaseAdmin.from("admin_users").select("*").eq("user_id", userId).single()

    if (!adminUser) {
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
    const { data, error } = await supabaseAdmin.from("admin_users").insert({
      user_id: newAdminId,
      username: null,
    })

    if (error) {
      bot.sendMessage(chatId, `Hata oluştu: ${error.message}`)
      return
    }

    bot.sendMessage(chatId, `Kullanıcı ID ${newAdminId} başarıyla admin olarak eklendi!`)
  })

  console.log("Telegram bot başlatıldı!")
  return bot
}

// Botu durdur
export function stopBot() {
  if (bot) {
    bot.stopPolling()
    bot = null
    console.log("Telegram bot durduruldu!")
  }
}
