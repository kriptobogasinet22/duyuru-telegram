import { NextResponse } from "next/server"
import { initBot } from "@/lib/telegram"

export async function GET() {
  try {
    // Botu başlat
    const bot = initBot()

    // Vercel URL'ini al
    const vercelUrl = process.env.VERCEL_URL || "duyuru-telegram.vercel.app"
    const webhookUrl = `https://${vercelUrl}/api/webhook`

    // Webhook'u ayarla
    const result = await bot.setWebHook(webhookUrl)

    // Webhook bilgilerini al
    const webhookInfo = await bot.getWebhookInfo()

    return NextResponse.json({
      success: true,
      message: `Webhook set to ${webhookUrl}`,
      result,
      webhookInfo,
    })
  } catch (error) {
    console.error("Webhook ayarlama hatası:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
