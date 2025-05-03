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
    // NOT: Vercel'in otomatik oluşturduğu URL'leri kullanmak yerine,
    // projenin kalıcı domain'ini kullanıyoruz
    const webhookUrl = "https://duyuru-telegram.vercel.app/api/webhook"

    try {
      // Önce mevcut webhook'u temizle
      await bot.deleteWebHook()

      // Sonra yeni webhook'u ayarla
      const result = await bot.setWebHook(webhookUrl)

      // Webhook bilgilerini al
      const webhookInfo = await bot.getWebHookInfo()

      return NextResponse.json({
        success: true,
        message: `Webhook set to ${webhookUrl}`,
        result,
        webhookInfo,
      })
    } catch (error) {
      console.error("Webhook ayarlama hatası:", error)
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
