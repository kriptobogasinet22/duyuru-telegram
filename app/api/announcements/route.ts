import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Tüm duyuruları getir
export async function GET() {
  try {
    // Duyuruları yükle
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Duyurular yükleme hatası:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      data,
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

// Yeni duyuru ekle
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Gerekli alanları kontrol et
    if (!body.chat_id || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: "chat_id ve message alanları gereklidir",
        },
        { status: 400 },
      )
    }

    // Önce chat bilgilerini al
    const { data: chatData, error: chatError } = await supabaseAdmin
      .from("bot_chats")
      .select("*")
      .eq("chat_id", body.chat_id)
      .single()

    if (chatError) {
      return NextResponse.json({
        success: false,
        error: `Grup/kanal bilgileri bulunamadı: ${chatError.message}`,
      })
    }

    // Duyuruyu veritabanına ekle
    const { data, error } = await supabaseAdmin.from("announcements").upsert(
      {
        chat_id: body.chat_id,
        chat_type: chatData.chat_type,
        chat_title: chatData.chat_title,
        message: body.message,
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
      message: "Duyuru başarıyla eklendi",
      data,
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
