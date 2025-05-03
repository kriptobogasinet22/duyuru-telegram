import { type NextRequest, NextResponse } from "next/server"
import { initBot } from "@/lib/telegram"

// Global bot örneği
let botInitialized = false

export async function GET() {
  // Botu başlat
  if (!botInitialized) {
    initBot()
    botInitialized = true
  }

  return NextResponse.json({ status: "Bot çalışıyor!" })
}

export async function POST(req: NextRequest) {
  // Botu başlat
  const bot = initBot()

  try {
    // Telegram'dan gelen webhook verilerini al
    const update = await req.json()
    
    // Debug için log ekleyin
    console.log("Webhook update alındı:", JSON.stringify(update))
    
    // Güncellemeyi bot'a ilet
    await bot.processUpdate(update)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook hatası:", error)
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 })
  }
}
