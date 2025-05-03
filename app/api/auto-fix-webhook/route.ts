import { NextResponse } from "next/server"
import { initBot } from "@/lib/telegram"

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

    // Sabit production URL'ini kullan
    const correctWebhookUrl = "https://duyuru-telegram.vercel.app/api/webhook"

    try {
      // Mevcut webhook bilgilerini al
      const webhookInfo = await bot.getWebHookInfo()

      // Eğer webhook URL'i doğru değilse, düzelt
      if (webhookInfo.url !== correctWebhookUrl) {
        console.log(`Webhook URL'i yanlış: ${webhookInfo.url}, düzeltiliyor...`)

        // Önce mevcut webhook'u temizle
        await bot.deleteWebHook()

        // Sonra doğru webhook'u ayarla
        const result = await bot.setWebHook(correctWebhookUrl)

        // Yeni webhook bilgilerini al
        const newWebhookInfo = await bot.getWebHookInfo()

        return NextResponse.json({
          success: true,
          message: `Webhook düzeltildi: ${correctWebhookUrl}`,
          oldUrl: webhookInfo.url,
          newUrl: newWebhookInfo.url,
          webhookInfo: newWebhookInfo,
        })
      }

      // Webhook zaten doğru
      return NextResponse.json({
        success: true,
        message: "Webhook zaten doğru ayarlanmış",
        webhookInfo,
      })
    } catch (error) {
      console.error("Webhook düzeltme hatası:", error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
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
